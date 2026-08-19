// Re-exports the shared Prisma client from src/db.js in the default-export
// shape that spaces.js, categories.js, expense.js, budget.js, and reports.js
// expect (`const prisma = require('../lib/prisma')`).
// Kept as a single underlying instance — not a second PrismaClient — so we
// don't open a duplicate connection pool alongside src/db.js.
const { prisma } = require('../db');

module.exports = prisma;