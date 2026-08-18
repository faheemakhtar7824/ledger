// server/src/db.js
//
// Single shared Prisma Client instance, imported by every route file.
// Pulled out of index.js now that we have more than one file needing it —
// avoids each route file (or index.js) creating its own client and opening
// separate connection pools.

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = { prisma };