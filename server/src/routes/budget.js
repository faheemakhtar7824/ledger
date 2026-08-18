const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

async function getOwnedSpace(spaceId, userId) {
  return prisma.space.findFirst({ where: { id: spaceId, userId } });
}

// GET /api/spaces/:spaceId/budget — overall + per-category budgets for a space
router.get('/spaces/:spaceId/budget', async (req, res) => {
  try {
    const space = await getOwnedSpace(req.params.spaceId, req.userId);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const budgets = await prisma.budget.findMany({
      where: { spaceId: space.id },
      include: { category: true },
    });

    res.json(budgets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// POST /api/spaces/:spaceId/budget — create overall or per-category budget
router.post('/spaces/:spaceId/budget', async (req, res) => {
  const { monthlyLimit, categoryId } = req.body;

  const parsedLimit = Number(monthlyLimit);
  if (!monthlyLimit || isNaN(parsedLimit) || parsedLimit <= 0) {
    return res.status(400).json({ error: 'Monthly limit must be a positive number' });
  }
  if (categoryId && typeof categoryId !== 'string') {
    return res.status(400).json({ error: 'Invalid category' });
  }

  try {
    const space = await getOwnedSpace(req.params.spaceId, req.userId);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, spaceId: space.id },
      });
      if (!category) return res.status(404).json({ error: 'Category not found in this space' });
    }

    // One overall budget (categoryId: null) and one per category — replace if exists
    const existing = await prisma.budget.findFirst({
      where: { spaceId: space.id, categoryId: categoryId || null },
    });

    const budget = existing
      ? await prisma.budget.update({
          where: { id: existing.id },
          data: { monthlyLimit: parsedLimit },
        })
      : await prisma.budget.create({
          data: {
            spaceId: space.id,
            categoryId: categoryId || null,
            monthlyLimit: parsedLimit,
          },
        });

    res.status(existing ? 200 : 201).json(budget);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save budget' });
  }
});

module.exports = router;