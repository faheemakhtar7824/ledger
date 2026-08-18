const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const { prisma } = require("../db"); // FIX #4: shared client, not a local `new PrismaClient()`

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 min, per security doc §1

// FIX #1: rate limiting on signup/login/verify-otp — security doc §1
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again later." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // separate from account lockout below — this is per-IP, lockout is per-account
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

function generateOtp() {
  // crypto.randomInt is cryptographically secure, unlike Math.random
  return crypto.randomInt(100000, 999999).toString();
}

function isStrongPassword(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return regex.test(password);
}

// Cookie options shared by login/logout — HTTP-only per security doc §1
// (never store tokens in localStorage, vulnerable to XSS)
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod; allow http in local dev
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches JWT expiry below
};

// POST /api/auth/signup
router.post("/signup", authLimiter, async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error:
          "Password must be 8+ characters and include uppercase, number, and special character",
      });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return res.status(409).json({ error: "Email or username already in use" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // FIX #5: User + Space + VerificationToken created atomically.
    // If any step fails, all roll back — no orphaned user-with-no-space,
    // no user-with-no-OTP-token.
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, username, email, passwordHash },
      });

      await tx.space.create({
        data: { userId: newUser.id, name: "Personal" },
      });

      await tx.verificationToken.create({
        data: {
          userId: newUser.id,
          code: otp,
          purpose: "email_verification",
          expiresAt: otpExpiresAt,
        },
      });

      return newUser;
    });

    console.log(`OTP for ${user.email}: ${otp}`); // stub — swap for Resend later

    res.status(201).json({
      message: "Signup successful. Verify your email with the OTP sent.",
      userId: user.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", authLimiter, async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const token = await prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        code,
        purpose: "email_verification",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!token) {
      return res.status(400).json({ error: "Invalid or expired code" });
    }

    await prisma.$transaction([
      prisma.verificationToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      }),
    ]);

    res.json({ message: "Email verified" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // FIX #2: account lockout after 5 failed attempts, security doc §1
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minsLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
      return res.status(423).json({
        error: `Account locked due to too many failed attempts. Try again in ${minsLeft} minute(s).`,
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : attempts, // reset counter once locked
          lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
        },
      });

      if (shouldLock) {
        return res.status(423).json({
          error: "Account locked due to too many failed attempts. Try again in 15 minutes.",
        });
      }
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ error: "Email not verified" });
    }

    // Successful login — reset any prior failed-attempt count
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // FIX #3: HTTP-only cookie instead of returning the token in the JSON
    // body — security doc §1 explicitly rules out localStorage-stored
    // tokens (XSS risk). Frontend must use credentials: 'include' (fetch)
    // or withCredentials: true (axios) for this cookie to be sent back.
    res.cookie("token", token, COOKIE_OPTIONS);

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.json({ message: "Logged out" });
});

module.exports = router;