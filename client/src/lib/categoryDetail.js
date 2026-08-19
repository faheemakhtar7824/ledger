import api from './api';
import { ENDPOINTS } from './endpoints';

// Category detail = category's expenses this month, grouped by time period
// ("This week" / "Earlier this month") per screens-and-flows.md §6.
// No dedicated backend endpoint for this — composed from expenses.js
// (categoryId filter) same pattern as dashboard.js.
export async function fetchCategoryDetail(spaceId, categoryId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const todayEnd = now.toISOString();

  const res = await api.get(ENDPOINTS.expenses.base(spaceId), {
    params: { categoryId, startDate: monthStart, endDate: todayEnd },
  });

  const expenses = res.data; // sorted date: desc already

  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);

  const thisWeek = expenses.filter((e) => new Date(e.date) >= oneWeekAgo);
  const earlier = expenses.filter((e) => new Date(e.date) < oneWeekAgo);

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return {
    total,
    count: expenses.length,
    groups: [
      { label: 'This week', items: thisWeek },
      { label: 'Earlier this month', items: earlier },
    ].filter((g) => g.items.length > 0),
  };
}