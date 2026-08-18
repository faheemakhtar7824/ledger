const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

// Verifies the space belongs to the authenticated user
async function getOwnedSpace(spaceId, userId) {
  return prisma.space.findFirst({ where: { id: spaceId, userId } });
}

// Verifies the category belongs to the given space
async function getOwnedCategory(categoryId, spaceId) {
  return prisma.category.findFirst({ where: { id: categoryId, spaceId } });
}

// Verifies the expense belongs to the given space
async function getOwnedExpense(expenseId, spaceId) {
  return prisma.expense.findFirst({ where: { id: expenseId, spaceId } });
}

// GET /api/spaces/:spaceId/expenses — list with filters (date range, category, amount range, search)
router.get('/spaces/:spaceId/expenses', async (req, res) => {
  const { startDate, endDate, categoryId, minAmount, maxAmount, search } = req.query;

  try {
    const space = await getOwnedSpace(req.params.spaceId, req.userId);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const where = { spaceId: space.id };

    // Date range
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const d = new Date(startDate);
        if (isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid startDate' });
        where.date.gte = d;
      }
      if (endDate) {
        const d = new Date(endDate);
        if (isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid endDate' });
        where.date.lte = d;
      }
    }

    // Category — verify it belongs to this space before filtering by it
    if (categoryId) {
      const category = await getOwnedCategory(categoryId, space.id);
      if (!category) return res.status(404).json({ error: 'Category not found in this space' });
      where.categoryId = categoryId;
    }

    // Amount range
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) {
        const n = Number(minAmount);
        if (isNaN(n)) return res.status(400).json({ error: 'Invalid minAmount' });
        where.amount.gte = n;
      }
      if (maxAmount) {
        const n = Number(maxAmount);
        if (isNaN(n)) return res.status(400).json({ error: 'Invalid maxAmount' });
        where.amount.lte = n;
      }
    }

    // Search by note (case-insensitive contains)
    if (search) {
      if (typeof search !== 'string') return res.status(400).json({ error: 'Invalid search' });
      where.note = { contains: search.trim().slice(0, 200), mode: 'insensitive' };
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/spaces/:spaceId/expenses — create expense
router.post('/spaces/:spaceId/expenses', async (req, res) => {
  const { categoryId, amount, date, note } = req.body;

  const parsedAmount = Number(amount);
  if (!categoryId || typeof categoryId !== 'string') {
    return res.status(400).json({ error: 'Category is required' });
  }
  if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }
  const parsedDate = date ? new Date(date) : new Date();
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date' });
  }
  if (note && typeof note !== 'string') {
    return res.status(400).json({ error: 'Note must be text' });
  }

  try {
    const space = await getOwnedSpace(req.params.spaceId, req.userId);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const category = await getOwnedCategory(categoryId, space.id);
    if (!category) return res.status(404).json({ error: 'Category not found in this space' });

    const expense = await prisma.expense.create({
      data: {
        spaceId: space.id,
        categoryId: category.id,
        amount: parsedAmount,
        date: parsedDate,
        note: note ? note.trim().slice(0, 500) : null, // basic length cap, defense-in-depth vs stored XSS
      },
      include: { category: true },
    });
    res.status(201).json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/spaces/:spaceId/expenses/:expenseId — edit expense
router.put('/spaces/:spaceId/expenses/:expenseId', async (req, res) => {
  const { categoryId, amount, date, note } = req.body;

  try {
    const space = await getOwnedSpace(req.params.spaceId, req.userId);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const expense = await getOwnedExpense(req.params.expenseId, space.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    const data = {};

    if (categoryId !== undefined) {
      if (typeof categoryId !== 'string') {
        return res.status(400).json({ error: 'Invalid category' });
      }
      const category = await getOwnedCategory(categoryId, space.id);
      if (!category) return res.status(404).json({ error: 'Category not found in this space' });
      data.categoryId = category.id;
    }

    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
      }
      data.amount = parsedAmount;
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date' });
      }
      data.date = parsedDate;
    }

    if (note !== undefined) {
      if (note !== null && typeof note !== 'string') {
        return res.status(400).json({ error: 'Note must be text' });
      }
      data.note = note ? note.trim().slice(0, 500) : null;
    }

    const updated = await prisma.expense.update({
      where: { id: expense.id },
      data,
      include: { category: true },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/spaces/:spaceId/expenses/:expenseId
router.delete('/spaces/:spaceId/expenses/:expenseId', async (req, res) => {
  try {
    const space = await getOwnedSpace(req.params.spaceId, req.userId);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const expense = await getOwnedExpense(req.params.expenseId, space.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    await prisma.expense.delete({ where: { id: expense.id } });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;