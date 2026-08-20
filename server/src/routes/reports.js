const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const requireAuth = require('../middleware/requireAuth');
const path = require('path');

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

    const bucketCount = period === 'weekly' ? 8 : 6;
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

// GET /api/spaces/:spaceId/reports/mom-comparison
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

// GET /api/spaces/:spaceId/reports/range-summary?startDate=...&endDate=...
router.get('/spaces/:spaceId/reports/range-summary', async (req, res) => {
  try {
    const space = await getOwnedSpace(req.params.spaceId, req.userId);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date' });
    }

    const where = { spaceId: space.id, date: { gte: start, lte: end } };

    const [totalAgg, grouped] = await Promise.all([
      prisma.expense.aggregate({ where, _sum: { amount: true }, _count: true }),
      prisma.expense.groupBy({
        by: ['categoryId'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

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

    res.json({
      total: Number(totalAgg._sum.amount || 0),
      count: totalAgg._count,
      breakdown,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch range summary' });
  }
});

// GET /api/spaces/:spaceId/reports/export.csv
router.get('/spaces/:spaceId/reports/export.csv', async (req, res) => {
  try {
    const space = await getOwnedSpace(req.params.spaceId, req.userId);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const { startDate, endDate } = req.query;
    const where = { spaceId: space.id };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rangeLabel = startDate || endDate
      ? `${startDate || 'start'}_to_${endDate || 'now'}`
      : 'all-time';

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
    res.setHeader('Content-Disposition', `attachment; filename="ledger-${space.name}-${rangeLabel}.csv"`);
    res.send(header + rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// GET /api/spaces/:spaceId/reports/export.pdf
router.get('/spaces/:spaceId/reports/export.pdf', async (req, res) => {
  try {
    const space = await getOwnedSpace(req.params.spaceId, req.userId);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const { startDate, endDate } = req.query;
    const where = { spaceId: space.id };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    const rangeLabel = startDate || endDate
      ? `${startDate || 'start'}_to_${endDate || 'now'}`
      : 'all-time';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ledger-${space.name}-${rangeLabel}.pdf"`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    const logoPath = path.join(__dirname, '..', 'assets', 'icon-512.png');
    try {
      doc.image(logoPath, 40, 36, { width: 36, height: 36 });
    } catch {
      // Logo missing — fall back to text-only header
    }

    doc.fontSize(16).fillColor('#0B6E4F').text('Ledger', 86, 40);
    doc.fontSize(9).fillColor('#6E6E73').text(space.name, 86, 60);

    doc.fontSize(9).fillColor('#A1A1A6').text(
      `Generated ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      40, 90
    );
    const rangeText = startDate || endDate
      ? `Range: ${startDate ? new Date(startDate).toLocaleDateString('en-GB') : 'start'} – ${endDate ? new Date(endDate).toLocaleDateString('en-GB') : 'now'}`
      : 'Range: all time';
    doc.text(rangeText, 40, 104);

    doc.moveTo(40, 122).lineTo(555, 122).strokeColor('#E5E5E7').stroke();

    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    doc.moveDown(1.2);
    doc.fontSize(10).fillColor('#1D1D1F').text(`Total: Rs ${total.toLocaleString()} · ${expenses.length} expenses`, 40, 134);

    let y = 160;
    const colX = { date: 40, category: 130, amount: 300, note: 380 };

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1D1D1F');
    doc.text('Date', colX.date, y);
    doc.text('Category', colX.category, y);
    doc.text('Amount', colX.amount, y);
    doc.text('Note', colX.note, y);
    y += 18;
    doc.moveTo(40, y).lineTo(555, y).strokeColor('#E5E5E7').stroke();
    y += 8;

    doc.font('Helvetica').fontSize(9.5).fillColor('#1D1D1F');
    expenses.forEach((e) => {
      if (y > 740) {
        doc.addPage();
        y = 50;
      }
      doc.text(e.date.toISOString().slice(0, 10), colX.date, y, { width: 80 });
      doc.text(e.category.name, colX.category, y, { width: 160 });
      doc.text(`Rs ${Number(e.amount).toLocaleString()}`, colX.amount, y, { width: 70 });
      doc.text(e.note || '-', colX.note, y, { width: 150 });
      y += 20;
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

module.exports = router;