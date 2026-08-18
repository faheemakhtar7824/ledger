const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

// Verifies the space belongs to the authenticated user
async function getOwnedSpace(spaceId, userId) {
  return prisma.space.findFirst({ where: { id: spaceId, userId } });
}

// GET /api/spaces/:spaceId/categories — list categories in a space
router.get('/spaces/:spaceId/categories', async (req, res) => {
  try {
    const space = await getOwnedSpace(req.params.spaceId, req.userId);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const categories = await prisma.category.findMany({
      where: { spaceId: space.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/spaces/:spaceId/categories — create category (inline, in-context)
router.post('/spaces/:spaceId/categories', async (req, res) => {
  const { name, icon, color } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const space = await getOwnedSpace(req.params.spaceId, req.userId);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const category = await prisma.category.create({
      data: {
        spaceId: space.id,
        name: name.trim(),
        icon: icon || null, // TODO: keyword-match default icon (product brief) — stub for now
        color: color || null,
      },
    });
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});
// Add after the POST /spaces/:spaceId/categories route, before module.exports

async function getOwnedCategory(categoryId, spaceId) {
  return prisma.category.findFirst({ where: { id: categoryId, spaceId } });
}

// PUT /api/spaces/:spaceId/categories/:categoryId — edit name/icon/color
router.put('/spaces/:spaceId/categories/:categoryId', async (req, res) => {
  const { name, icon, color } = req.body;

  try {
    const space = await getOwnedSpace(req.params.spaceId, req.userId);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const category = await getOwnedCategory(req.params.categoryId, space.id);
    if (!category) return res.status(404).json({ error: 'Category not found in this space' });

    const data = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Category name is required' });
      }
      data.name = name.trim();
    }
    if (icon !== undefined) data.icon = icon || null;
    if (color !== undefined) data.color = color || null;

    const updated = await prisma.category.update({
      where: { id: category.id },
      data,
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/spaces/:spaceId/categories/:categoryId — cascades to its expenses (onDelete: Cascade)
router.delete('/spaces/:spaceId/categories/:categoryId', async (req, res) => {
  try {
    const space = await getOwnedSpace(req.params.spaceId, req.userId);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const category = await getOwnedCategory(req.params.categoryId, space.id);
    if (!category) return res.status(404).json({ error: 'Category not found in this space' });

    await prisma.category.delete({ where: { id: category.id } });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;