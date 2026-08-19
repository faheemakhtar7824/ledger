import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpace } from '../context/SpaceContext';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardData } from '../lib/dashboard';
import { formatMoney } from '../lib/currency';
import { IconSettings, IconPlus } from '../components/icons';
import { LogoMark } from '../components/Logo';
import IconTile from '../components/IconTile';
import SpaceSwitcher from '../components/SpaceSwitcher';
import AddExpenseSheet from '../components/AddExpenseSheet';
import EditExpenseSheet from '../components/EditExpenseSheet';
import Logo from '../components/Logo';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const MONTH_LABEL = new Date().toLocaleString('default', { month: 'long' }).toUpperCase();

function TopBar({ onSettings }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
      <Logo size={30} />
      <button onClick={onSettings} aria-label="Settings" className="icon-circle-btn">
        <IconSettings size={16} />
      </button>
    </div>
  );
}

function BudgetAlertBanner({ pctUsed, budgetLeft, currency }) {
  const isOver = pctUsed >= 100;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'color-mix(in srgb, var(--text-danger) 12%, var(--surface-2))',
        border: '0.5px solid var(--text-danger)',
        borderRadius: 12,
        padding: '10px 12px',
        marginBottom: 18,
      }}
    >
      <i className="ti ti-alert-triangle" style={{ color: 'var(--text-danger)', fontSize: 16 }}></i>
      <span style={{ fontSize: 12.5, color: 'var(--text-danger)' }}>
        {isOver
          ? `Over budget — ${formatMoney(Math.abs(budgetLeft), currency)} past your limit`
          : `${Math.round(pctUsed)}% of your monthly budget used`}
      </span>
    </div>
  );
}

function TotalSpentBlock({ total, trendState, trendPct, currency }) {
  let trendLine;
  if (trendState === 'up') {
    trendLine = (
      <>
        <span style={{ color: 'var(--text-danger)', fontWeight: 500 }}>↑ {trendPct}%</span>{' '}
        <span style={{ color: 'var(--text-muted)' }}>vs last month</span>
      </>
    );
  } else if (trendState === 'down') {
    trendLine = (
      <>
        <span style={{ color: 'var(--text-accent)', fontWeight: 500 }}>↓ {trendPct}%</span>{' '}
        <span style={{ color: 'var(--text-muted)' }}>vs last month</span>
      </>
    );
  } else if (trendState === 'no-data') {
    trendLine = <span style={{ color: 'var(--text-muted)' }}>New spending this month</span>;
  } else {
    trendLine = <span style={{ color: 'var(--text-muted)' }}>No change vs last month</span>;
  }

  return (
    <>
      <p className="label-serif" style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 2px' }}>
        Total spent
      </p>
      <p className="tabular-nums" style={{ fontSize: 40, fontWeight: 500, margin: '0 0 2px', letterSpacing: '-0.5px' }}>
        {formatMoney(total, currency)}
      </p>
      <p style={{ fontSize: 13, margin: '0 0 22px' }}>{trendLine}</p>
    </>
  );
}

function MetricGrid({ hasBudget, budgetLeft, txnCount, currency }) {
  return (
    <div className="metric-grid">
      <div className="metric-card">
        <p>Budget left</p>
        <p className="tabular-nums">{hasBudget ? formatMoney(budgetLeft, currency) : 'Not set'}</p>
      </div>
      <div className="metric-card">
        <p>Transactions</p>
        <p className="tabular-nums">{txnCount}</p>
      </div>
    </div>
  );
}

function CategoryBars({ categories, remainingCount, currency, onSeeAll, onTapCategory }) {
  const max = Math.max(...categories.map((c) => c.amt), 1);
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Categories</p>
        <span style={{ fontSize: 13, color: 'var(--text-accent)', cursor: 'pointer' }} onClick={onSeeAll}>
          See all{remainingCount > 0 ? ` (+${remainingCount})` : ''}
        </span>
      </div>

      {categories.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No expenses logged this month yet.</p>
      )}

      {categories.map((c, i) => (
        <div className="cat-row" key={c.id} style={{ cursor: 'pointer' }} onClick={() => onTapCategory(c.id)}>
          <IconTile label={c.name} />
          <div className="cat-body">
            <div className="cat-top">
              <span>{c.name}</span>
              <span className="tabular-nums" style={{ fontWeight: 500 }}>
                {formatMoney(c.amt, currency)}
              </span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                data-w={((c.amt / max) * 100).toFixed(0)}
                style={{ width: '0%', transitionDelay: `${i * 0.08}s` }}
              />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function RecentList({ recent, currency, onTapExpense, onSeeAll }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 12px' }}>
        <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Recent</p>
        <span style={{ fontSize: 13, color: 'var(--text-accent)', cursor: 'pointer' }} onClick={onSeeAll}>
          See all
        </span>
      </div>

      {recent.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No recent transactions.</p>
      )}

      {recent.map((r) => (
        <div className="txn-row" key={r.id} style={{ cursor: 'pointer' }} onClick={() => onTapExpense(r)}>
          <div className="txn-left">
            <IconTile label={r.name} />
            <div>
              <p className="txn-name">{r.name}</p>
              <p className="txn-date">{formatDate(r.date)}</p>
            </div>
          </div>
          <span className="txn-amt tabular-nums">-{formatMoney(r.amt, currency)}</span>
        </div>
      ))}

      <div style={{ height: 90 }} />
    </>
  );
}

export default function Dashboard() {
  const { activeSpaceId, loading: spaceLoading } = useSpace();
  const { user } = useAuth();
  const navigate = useNavigate();
  const currency = user?.currencyPreference || 'PKR';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const load = useCallback(async () => {
    if (!activeSpaceId) return;
    setLoading(true);
    setError('');
    try {
      setData(await fetchDashboardData(activeSpaceId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [activeSpaceId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(() => {
      document.querySelectorAll('.bar-fill[data-w]').forEach((el) => {
        el.style.width = el.dataset.w + '%';
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [data]);

  const showBudgetAlert = useMemo(
    () => !!data && data.hasBudget && data.budgetPctUsed !== null && data.budgetPctUsed >= 80,
    [data]
  );

  if (spaceLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--text-secondary)]">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--text-danger)]">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--text-secondary)]">
        No space found.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 18px 110px' }}>
      <TopBar onSettings={() => navigate('/settings')} />

      <p className="label-serif" style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, margin: '14px 0 14px' }}>
        {MONTH_LABEL}
      </p>

      <SpaceSwitcher />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSpaceId}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        >
          {showBudgetAlert && <BudgetAlertBanner pctUsed={data.budgetPctUsed} budgetLeft={data.budgetLeft} currency={currency} />}

          <TotalSpentBlock total={data.total} trendState={data.trendState} trendPct={data.trendPct} currency={currency} />

          <MetricGrid hasBudget={data.hasBudget} budgetLeft={data.budgetLeft} txnCount={data.txnCount} currency={currency} />

          <CategoryBars
            categories={data.categories}
            remainingCount={Math.max(0, data.categoryCount - data.categories.length)}
            currency={currency}
            onSeeAll={() => navigate('/categories')}
            onTapCategory={(categoryId) => navigate(`/categories/${categoryId}`)}
          />

          <RecentList recent={data.recent} currency={currency} onTapExpense={setEditingExpense} onSeeAll={() => navigate('/history')} />
        </motion.div>
      </AnimatePresence>

      <button className="fab" aria-label="Add expense" onClick={() => setSheetOpen(true)}>
        <IconPlus size={26} color="var(--surface-2)" strokeWidth={2.75} />
      </button>

      <AddExpenseSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSaved={load} />

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