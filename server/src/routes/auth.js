const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const { prisma } = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { sendOtpEmail } = require("../lib/mailer");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again later." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

function isStrongPassword(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return regex.test(password);
}

// Emails are case-insensitive by convention (RFC 5321 technically allows
// case-sensitive local parts, but no major provider actually enforces
// this, and users expect Test@Gmail.com == test@gmail.com). Normalize on
// every read/write so lookups are consistent regardless of how it was typed.
function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : email;
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const SUPPORTED_CURRENCIES = ["PKR", "USD", "EUR", "GBP", "AED", "SAR", "INR"];

// POST /api/auth/signup
router.post("/signup", authLimiter, async (req, res) => {
  try {
    const { name, username, password } = req.body;
    const email = normalizeEmail(req.body.email);

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

    try {
      await sendOtpEmail(user.email, otp, "email_verification");
    } catch (mailErr) {
      console.error("Failed to send verification email:", mailErr.message);
      console.log(`[Fallback] OTP for ${user.email}: ${otp}`);
    }

    res.status(201).json({
      message: "Signup successful. Verify your email with the OTP sent.",
      userId: user.id,
      email: user.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", authLimiter, async (req, res) => {
  try {
    const { code } = req.body;
    const email = normalizeEmail(req.body.email);
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

    res.json({ message: "Email verified", email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

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
          failedLoginAttempts: shouldLock ? 0 : attempts,
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

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, COOKIE_OPTIONS);

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        currencyPreference: user.currencyPreference,
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

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        currencyPreference: true,
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// PATCH /api/auth/me
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const { currencyPreference } = req.body;

    if (currencyPreference !== undefined) {
      if (!SUPPORTED_CURRENCIES.includes(currencyPreference)) {
        return res.status(400).json({ error: "Unsupported currency" });
      }
    }

    const data = {};
    if (currencyPreference !== undefined) data.currencyPreference = currencyPreference;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        currencyPreference: true,
      },
    });

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", authLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const otp = generateOtp();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.verificationToken.create({
        data: {
          userId: user.id,
          code: otp,
          purpose: "password_reset",
          expiresAt: otpExpiresAt,
        },
      });

      try {
        await sendOtpEmail(user.email, otp, "password_reset");
      } catch (mailErr) {
        console.error("Failed to send reset email:", mailErr.message);
        console.log(`[Fallback] Password reset OTP for ${user.email}: ${otp}`);
      }
    }

    res.json({ message: "If that email is registered, a reset code has been sent." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process request" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", authLimiter, async (req, res) => {
  try {
    const { code, newPassword } = req.body;
    const email = normalizeEmail(req.body.email);
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Email, code, and new password are required" });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error:
          "Password must be 8+ characters and include uppercase, number, and special character",
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid or expired code" });

    const token = await prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        code,
        purpose: "password_reset",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!token) {
      return res.status(400).json({ error: "Invalid or expired code" });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.$transaction([
      prisma.verificationToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
    ]);

    res.json({ message: "Password reset successful. You can now log in." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

module.exports = router;