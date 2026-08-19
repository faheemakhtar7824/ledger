import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { ENDPOINTS } from '../lib/endpoints';
import { useSpace } from '../context/SpaceContext';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../lib/currency';
import { fetchCategoryDetail } from '../lib/categoryDetail';
import EditExpenseSheet from '../components/EditExpenseSheet';
import IconTile from '../components/IconTile';
import { IconChevronLeft } from '../components/icons';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function CategoryHeader({ category, total, count, currency, onBack }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <button className="back-btn" onClick={onBack} aria-label="Back">
          <IconChevronLeft size={18} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 500 }}>{category.name}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0 20px' }}>
        <IconTile label={category.name} size={52} iconSize={24} />
        <div>
          <p className="tabular-nums" style={{ fontSize: 28, fontWeight: 500, margin: 0 }}>
            {formatMoney(total, currency)}
          </p>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            {count} expense{count !== 1 ? 's' : ''} this month
          </p>
        </div>
      </div>
    </>
  );
}

function ExpenseGroups({ groups, categoryName, currency, onTapExpense }) {
  if (groups.length === 0) {
    return <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No expenses logged this month yet.</p>;
  }

  return groups.map((g) => (
    <div key={g.label}>
      <p
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
          margin: '16px 0 4px',
        }}
      >
        {g.label}
      </p>
      {g.items.map((it) => (
        <div className="txn-row" key={it.id} style={{ cursor: 'pointer' }} onClick={() => onTapExpense(it)}>
          <div className="txn-left">
            <IconTile label={categoryName} />
            <div>
              <p className="txn-name">{it.note || categoryName}</p>
              <p className="txn-date">{formatDate(it.date)}</p>
            </div>
          </div>
          <span className="txn-amt tabular-nums">-{formatMoney(it.amount, currency)}</span>
        </div>
      ))}
    </div>
  ));
}

export default function CategoryDetail() {
  const { categoryId } = useParams();
  const { activeSpaceId } = useSpace();
  const { user } = useAuth();
  const currency = user?.currencyPreference || 'PKR';
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingExpense, setEditingExpense] = useState(null);

  const load = useCallback(async () => {
    if (!activeSpaceId || !categoryId) return;
    setLoading(true);
    setError('');
    try {
      const [catsRes, detailData] = await Promise.all([
        api.get(ENDPOINTS.categories.base(activeSpaceId)),
        fetchCategoryDetail(activeSpaceId, categoryId),
      ]);
      const cat = catsRes.data.find((c) => c.id === categoryId);
      if (!cat) {
        setError('Category not found');
      } else {
        setCategory(cat);
        setDetail(detailData);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load category');
    } finally {
      setLoading(false);
    }
  }, [activeSpaceId, categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--text-secondary)]">
        Loading…
      </div>
    );
  }

  if (error || !category || !detail) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--text-danger)]">
        {error || 'Not found'}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 18px 40px' }}>
      <CategoryHeader
        category={category}
        total={detail.total}
        count={detail.count}
        currency={currency}
        onBack={() => navigate('/categories')}
      />

      <ExpenseGroups
        groups={detail.groups}
        categoryName={category.name}
        currency={currency}
        onTapExpense={(it) => setEditingExpense({ ...it, category, categoryId: category.id })}
      />

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