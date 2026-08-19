const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

async function findDuplicateName(userId, name, excludeSpaceId = null) {
  const spaces = await prisma.space.findMany({
    where: { userId, ...(excludeSpaceId ? { id: { not: excludeSpaceId } } : {}) },
    select: { id: true, name: true },
  });
  const normalized = name.trim().toLowerCase();
  return spaces.find((s) => s.name.trim().toLowerCase() === normalized) || null;
}

// GET /api/spaces — list all spaces for the authenticated user
router.get('/', async (req, res) => {
  try {
    const spaces = await prisma.space.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(spaces);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch spaces' });
  }
});

// POST /api/spaces — create a new space
router.post('/', async (req, res) => {
  const { name, icon, color } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Space name is required' });
  }

  try {
    // Server-side uniqueness check per 05-security-requirements.md —
    // all inputs validated server-side, not just client-side.
    const duplicate = await findDuplicateName(req.userId, name);
    if (duplicate) {
      return res.status(409).json({ error: `You already have a space named "${duplicate.name}"` });
    }

    const space = await prisma.space.create({
      data: {
        userId: req.userId,
        name: name.trim(),
        icon: icon || null,
        color: color || null,
      },
    });
    res.status(201).json(space);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create space' });
  }
});

// GET /api/spaces/:id — fetch one space (verifies ownership — "switch" reads through this)
router.get('/:id', async (req, res) => {
  try {
    const space = await prisma.space.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!space) {
      return res.status(404).json({ error: 'Space not found' });
    }

    res.json(space);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch space' });
  }
});

// PUT /api/spaces/:id — rename / update icon/color
router.put('/:id', async (req, res) => {
  const { name, icon, color } = req.body;

  try {
    const space = await prisma.space.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const data = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Space name is required' });
      }
      const duplicate = await findDuplicateName(req.userId, name, space.id);
      if (duplicate) {
        return res.status(409).json({ error: `You already have a space named "${duplicate.name}"` });
      }
      data.name = name.trim();
    }
    if (icon !== undefined) data.icon = icon || null;
    if (color !== undefined) data.color = color || null;

    const updated = await prisma.space.update({
      where: { id: space.id },
      data,
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update space' });
  }
});

// DELETE /api/spaces/:id — cascades to categories/expenses/budgets (onDelete: Cascade in schema)
router.delete('/:id', async (req, res) => {
  try {
    const space = await prisma.space.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const spaceCount = await prisma.space.count({ where: { userId: req.userId } });
    if (spaceCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete your only space' });
    }

    await prisma.space.delete({ where: { id: space.id } });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete space' });
  }
});

module.exports = router;