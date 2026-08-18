const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

async function getOwnedSpace(spaceId, userId) {
  return prisma.space.findFirst({ where: { id: spaceId, userId } });
}

function monthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  return { start, end };
}

// GET /api/spaces/:spaceId/reports/trend?period=monthly|weekly
router.get('/spaces/:spaceId/reports/trend', async (req, res) => {
  const period = req.query.period === 'weekly' ? 'weekly' : 'monthly';

  try {
    const space = await getOwnedSpace(req.params.spaceId, req.userId);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const bucketCount = period === 'weekly' ? 8 : 6; // last 8 weeks or last 6 months
    const buckets = [];

    for (let i = bucketCount - 1; i >= 0; i--) {
      let start, end, label;
      if (period === 'monthly') {
        const r = monthRange(-i);
        start = r.start;
        end = r.end;
        label = start.toLocaleString('default', { month: 'short', year: 'numeric' });
      } else {
        const now = new Date();
        end = new Date(now);
        end.setDate(now.getDate() - i * 7);
        start = new Date(end);
        start.setDate(end.getDate() - 7);
        label = `Wk of ${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;
      }

      const agg = await prisma.expense.aggregate({
        where: { spaceId: space.id, date: { gte: start, lt: end } },
        _sum: { amount: true },
      });

      buckets.push({ label, total: Number(agg._sum.amount || 0) });
    }

    res.json({ period, buckets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trend data' });
  }
});

// GET /api/spaces/:spaceId/reports/category-breakdown
router.get('/spaces/:spaceId/reports/category-breakdown', async (req, res) => {
  try {
    const space = await getOwnedSpace(req.params.spaceId, req.userId);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const { start, end } = monthRange(0);

    const grouped = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: { spaceId: space.id, date: { gte: start, lt: end } },
      _sum: { amount: true },
      _count: true,
    });

    const categoryIds = grouped.map((g) => g.categoryId);
    const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
    const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

    const breakdown = grouped
      .map((g) => ({
        categoryId: g.categoryId,
        name: categoryMap[g.categoryId]?.name || 'Unknown',
        icon: categoryMap[g.categoryId]?.icon || null,
        total: Number(g._sum.amount || 0),
        count: g._count,
      }))
      .sort((a, b) => b.total - a.total);

    res.json(breakdown);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch category breakdown' });
  }
});

// GET /api/spaces/:spaceId/reports/mom-comparison — month-over-month
router.get('/spaces/:spaceId/reports/mom-comparison', async (req, res) => {
  try {
    const space = await getOwnedSpace(req.params.spaceId, req.userId);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const { start: thisStart, end: thisEnd } = monthRange(0);
    const { start: lastStart, end: lastEnd } = monthRange(-1);

    const [thisAgg, lastAgg] = await Promise.all([
      prisma.expense.aggregate({
        where: { spaceId: space.id, date: { gte: thisStart, lt: thisEnd } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { spaceId: space.id, date: { gte: lastStart, lt: lastEnd } },
        _sum: { amount: true },
      }),
    ]);

    const thisMonth = Number(thisAgg._sum.amount || 0);
    const lastMonth = Number(lastAgg._sum.amount || 0);
    const diff = thisMonth - lastMonth;
    const pctChange = lastMonth > 0 ? Math.round((diff / lastMonth) * 100) : null;

    res.json({ thisMonth, lastMonth, diff, pctChange });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch comparison data' });
  }
});

// GET /api/spaces/:spaceId/reports/export.csv
router.get('/spaces/:spaceId/reports/export.csv', async (req, res) => {
  try {
    const space = await getOwnedSpace(req.params.spaceId, req.userId);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const expenses = await prisma.expense.findMany({
      where: { spaceId: space.id },
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const header = 'Date,Category,Amount,Note\n';
    const rows = expenses
      .map((e) =>
        [
          e.date.toISOString().slice(0, 10),
          escapeCsv(e.category.name),
          e.amount,
          escapeCsv(e.note),
        ].join(',')
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="expenses-${space.name}.csv"`);
    res.send(header + rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});
// Add after the export.csv route, before module.exports

// GET /api/spaces/:spaceId/reports/export.pdf
router.get('/spaces/:spaceId/reports/export.pdf', async (req, res) => {
  try {
    const space = await getOwnedSpace(req.params.spaceId, req.userId);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const expenses = await prisma.expense.findMany({
      where: { spaceId: space.id },
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="expenses-${space.name}.pdf"`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(16).text(`Expense report — ${space.name}`, { align: 'left' });
    doc.moveDown();

    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    doc.fontSize(10).fillColor('#6E6E73').text(`Total: Rs ${total.toLocaleString()} · ${expenses.length} expenses`);
    doc.moveDown();

    doc.fontSize(11).fillColor('#1D1D1F');
    const colX = { date: 40, category: 130, amount: 300, note: 380 };

    doc.font('Helvetica-Bold');
    doc.text('Date', colX.date, doc.y, { continued: false });
    doc.text('Category', colX.category, doc.y - doc.currentLineHeight());
    doc.text('Amount', colX.amount, doc.y - doc.currentLineHeight());
    doc.text('Note', colX.note, doc.y - doc.currentLineHeight());
    doc.moveDown(0.5);
    doc.font('Helvetica');

    expenses.forEach((e) => {
      const y = doc.y;
      if (y > 720) doc.addPage();
      const rowY = doc.y;
      doc.text(e.date.toISOString().slice(0, 10), colX.date, rowY, { width: 80 });
      doc.text(e.category.name, colX.category, rowY, { width: 160 });
      doc.text(`Rs ${Number(e.amount).toLocaleString()}`, colX.amount, rowY, { width: 70 });
      doc.text(e.note || '-', colX.note, rowY, { width: 150 });
      doc.moveDown(0.7);
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

module.exports = router;