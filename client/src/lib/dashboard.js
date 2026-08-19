import api from './api';
import { ENDPOINTS } from './endpoints';

// Aggregates dashboard data from 4 parallel calls — no dedicated backend
// dashboard endpoint exists (confirmed against reports.js, budget.js,
// expense.js). mom-comparison → total/trend, budget → budget-left,
// category-breakdown → bars, expenses (month-filtered) → recent + count.
export async function fetchDashboardData(spaceId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const todayEnd = now.toISOString();

  const [momRes, budgetRes, breakdownRes, expensesRes] = await Promise.all([
    api.get(ENDPOINTS.reports.momComparison(spaceId)),
    api.get(ENDPOINTS.budgets.base(spaceId)),
    api.get(ENDPOINTS.reports.categoryBreakdown(spaceId)),
    api.get(ENDPOINTS.expenses.base(spaceId), {
      params: { startDate: monthStart, endDate: todayEnd },
    }),
  ]);

  const { thisMonth, pctChange, diff } = momRes.data;

  // Overall budget = the one record with categoryId: null (per budget.js)
  const overallBudget = budgetRes.data.find((b) => b.categoryId === null) || null;
  const budgetLimit = overallBudget ? Number(overallBudget.monthlyLimit) : null;
  const budgetLeft = overallBudget ? budgetLimit - thisMonth : null;
  const budgetPctUsed = overallBudget && budgetLimit > 0 ? (thisMonth / budgetLimit) * 100 : null;

  // Trend state — distinguish "no prior month to compare against" (null
  // pctChange) from an actual 0% change, so the UI never shows a fake
  // "0%" in an alarm color when there's simply no baseline yet.
  let trendState; // 'up' | 'down' | 'flat' | 'no-data'
  let trendPct = null;
  if (pctChange === null) {
    trendState = thisMonth > 0 ? 'no-data' : 'flat';
  } else if (diff > 0) {
    trendState = 'up';
    trendPct = Math.abs(pctChange);
  } else if (diff < 0) {
    trendState = 'down';
    trendPct = Math.abs(pctChange);
  } else {
    trendState = 'flat';
    trendPct = 0;
  }

  const expenses = expensesRes.data; // already sorted date: desc by backend

  const allCategories = breakdownRes.data.map((c) => ({
    id: c.categoryId,
    name: c.name,
    amt: c.total,
  }));

  return {
    total: thisMonth,
    trendState,
    trendPct,
    hasBudget: !!overallBudget,
    budgetLimit,
    budgetLeft,
    budgetPctUsed,
    txnCount: expenses.length,
    categories: allCategories.slice(0, 4),
    categoryCount: allCategories.length,
    recent: expenses.slice(0, 10).map((e) => ({
      id: e.id,
      categoryId: e.categoryId,
      category: e.category,
      name: e.category?.name || 'Uncategorized',
      date: e.date,
      amount: Number(e.amount),
      amt: Number(e.amount),
      note: e.note,
    })),
  };
}