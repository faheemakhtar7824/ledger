import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { ENDPOINTS } from '../lib/endpoints';
import { useSpace } from '../context/SpaceContext';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../lib/currency';
import IconTile from '../components/IconTile';
import EditExpenseSheet from '../components/EditExpenseSheet';
import CategoryFilterPicker from '../components/CategoryFilterPicker';
import { IconChevronLeft, IconFilter } from '../components/icons';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ExpenseHistory() {
  const { activeSpaceId } = useSpace();
  const { user } = useAuth();
  const currency = user?.currencyPreference || 'PKR';
  const navigate = useNavigate();

  const [allExpenses, setAllExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingExpense, setEditingExpense] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    categoryId: '',
    minAmount: '',
    maxAmount: '',
    search: '',
  });

  const load = useCallback(async () => {
    if (!activeSpaceId) return;
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.minAmount) params.minAmount = filters.minAmount;
      if (filters.maxAmount) params.maxAmount = filters.maxAmount;

      const res = await api.get(ENDPOINTS.expenses.base(activeSpaceId), { params });
      setAllExpenses(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [activeSpaceId, filters.startDate, filters.endDate, filters.categoryId, filters.minAmount, filters.maxAmount]);

  useEffect(() => {
    if (!activeSpaceId) return;
    api.get(ENDPOINTS.categories.base(activeSpaceId)).then((res) => setCategories(res.data));
  }, [activeSpaceId]);

  useEffect(() => {
    load();
  }, [load]);

  const expenses = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    if (!q) return allExpenses;
    return allExpenses.filter((e) => {
      const categoryName = (e.category?.name || '').toLowerCase();
      const note = (e.note || '').toLowerCase();
      return categoryName.includes(q) || note.includes(q);
    });
  }, [allExpenses, filters.search]);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters({ startDate: '', endDate: '', categoryId: '', minAmount: '', maxAmount: '', search: '' });
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 18px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <button className="back-btn" onClick={() => navigate('/')} aria-label="Back">
          <IconChevronLeft size={18} />
        </button>
        <p style={{ fontSize: 15, fontWeight: 500, margin: 0, flex: 1 }}>All transactions</p>
        <button
          onClick={() => setShowFilters((s) => !s)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, border: 'none',
            background: showFilters ? 'var(--text-accent)' : 'var(--surface-1)',
            color: showFilters ? 'var(--surface-2)' : 'var(--text-primary)',
            borderRadius: 10, padding: '6px 10px', fontSize: 12.5, cursor: 'pointer',
          }}
        >
          <IconFilter size={13} />
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
      </div>

      <input
        className="auth-input"
        type="text"
        placeholder="Search by category or note…"
        value={filters.search}
        onChange={(e) => updateFilter('search', e.target.value)}
        style={{ marginBottom: showFilters ? 10 : 16 }}
      />

      {showFilters && (
        <div style={{ background: 'var(--surface-1)', borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>From</p>
              <input
                type="date"
                className="auth-input"
                style={{ marginBottom: 0, background: 'var(--surface-2)' }}
                value={filters.startDate}
                onChange={(e) => updateFilter('startDate', e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>To</p>
              <input
                type="date"
                className="auth-input"
                style={{ marginBottom: 0, background: 'var(--surface-2)' }}
                value={filters.endDate}
                onChange={(e) => updateFilter('endDate', e.target.value)}
              />
            </div>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>Category</p>
          <div style={{ marginBottom: 10 }}>
            <CategoryFilterPicker
              categories={categories}
              value={filters.categoryId}
              onSelect={(id) => updateFilter('categoryId', id)}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>Min amount</p>
              <input
                type="number"
                inputMode="decimal"
                className="auth-input"
                placeholder="0"
                style={{ marginBottom: 0, background: 'var(--surface-2)' }}
                value={filters.minAmount}
                onChange={(e) => updateFilter('minAmount', e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>Max amount</p>
              <input
                type="number"
                inputMode="decimal"
                className="auth-input"
                placeholder="No limit"
                style={{ marginBottom: 0, background: 'var(--surface-2)' }}
                value={filters.maxAmount}
                onChange={(e) => updateFilter('maxAmount', e.target.value)}
              />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              style={{
                width: '100%', padding: '9px 0', border: 'none', borderRadius: 10,
                background: 'var(--surface-2)', color: 'var(--text-danger)', fontSize: 13,
                fontWeight: 500, cursor: 'pointer',
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {!loading && expenses.length > 0 && (
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 12 }}>
          {expenses.length} expense{expenses.length !== 1 ? 's' : ''} · {formatMoney(total, currency)} total
        </p>
      )}

      {error && <p style={{ fontSize: 13, color: 'var(--text-danger)', marginBottom: 12 }}>{error}</p>}

      {loading && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading…</p>
      )}

      {!loading && expenses.length === 0 && !error && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {filters.search
            ? `No transactions found for "${filters.search}".`
            : 'No transactions match these filters.'}
        </p>
      )}

      {expenses.map((e) => (
        <div
          className="txn-row"
          key={e.id}
          style={{ cursor: 'pointer' }}
          onClick={() => setEditingExpense(e)}
        >
          <div className="txn-left">
            <IconTile label={e.category?.name} />
            <div>
              <p className="txn-name">{e.note || e.category?.name || 'Uncategorized'}</p>
              <p className="txn-date">{e.category?.name} · {formatDate(e.date)}</p>
            </div>
          </div>
          <span className="txn-amt tabular-nums">-{formatMoney(e.amount, currency)}</span>
        </div>
      ))}

      <EditExpenseSheet
        open={!!editingExpense}
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onSaved={load}
        onDeleted={load}
      />
    </div>
  );
}