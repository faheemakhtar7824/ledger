require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { prisma } = require('./src/db');
const authRoutes = require('./src/routes/auth');
const spacesRoutes = require('./src/routes/spaces');
const categoriesRoutes = require('./src/routes/categories');
const expensesRoutes = require('./src/routes/expense');
const budgetRoutes = require('./src/routes/budget');
const reportsRoutes = require('./src/routes/reports');

const app = express();
app.set('trust proxy', 1);

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Health check — MUST be registered before any router that applies
// requireAuth unconditionally at the router level (categories, expense,
// budget, reports all do `router.use(requireAuth)` mounted at '/api',
// which intercepts every /api/* request by path-prefix match, including
// this one, if registered after them).
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      server: 'running',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Health check DB error:', err);
    res.status(503).json({
      status: 'error',
      server: 'running',
      database: 'unreachable',
    });
  }
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/spaces', spacesRoutes);
app.use('/api', categoriesRoutes);
app.use('/api', expensesRoutes);
app.use('/api', budgetRoutes);
app.use('/api', reportsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});