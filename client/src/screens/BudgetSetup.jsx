import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { ENDPOINTS } from '../lib/endpoints';
import { useSpace } from '../context/SpaceContext';
import { useAuth } from '../context/AuthContext';
import { getCurrencySymbol } from '../lib/currency';
import { IconChevronLeft } from '../components/icons';
import IconTile from '../components/IconTile';

export default function BudgetSetup() {
  const { activeSpaceId } = useSpace();
  const { user } = useAuth();
  const currencySymbol = getCurrencySymbol(user?.currencyPreference || 'PKR');
  const navigate = useNavigate();

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [overallInput, setOverallInput] = useState('');
  const [catInputs, setCatInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingKey, setSavingKey] = useState(null);

  const load = useCallback(async () => {
    if (!activeSpaceId) return;
    setLoading(true);
    setError('');
    try {
      const [budgetRes, catRes] = await Promise.all([
        api.get(ENDPOINTS.budgets.base(activeSpaceId)),
        api.get(ENDPOINTS.categories.base(activeSpaceId)),
      ]);
      setBudgets(budgetRes.data);
      setCategories(catRes.data);

      const overall = budgetRes.data.find((b) => b.categoryId === null);
      setOverallInput(overall ? String(overall.monthlyLimit) : '');

      const perCat = {};
      catRes.data.forEach((c) => {
        const b = budgetRes.data.find((b) => b.categoryId === c.id);
        perCat[c.id] = b ? String(b.monthlyLimit) : '';
      });
      setCatInputs(perCat);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [activeSpaceId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveBudget(categoryId, value, key) {
    const parsed = Number(value);
    if (!value || isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid positive amount');
      return;
    }
    setError('');
    setSavingKey(key);
    try {
      await api.post(ENDPOINTS.budgets.base(activeSpaceId), {
        monthlyLimit: parsed,
        categoryId: categoryId || undefined,
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save budget');
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--text-secondary)]">
        Loading…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 18px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <button className="back-btn" onClick={() => navigate('/settings')} aria-label="Back">
          <IconChevronLeft size={18} />
        </button>
        <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Budget</p>
      </div>
      <p className="label-serif" style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
        Monthly limits for this space
      </p>

      {error && <p style={{ fontSize: 13, color: 'var(--text-danger)', marginBottom: 12 }}>{error}</p>}

      <p className="settings-group-label" style={{ marginTop: 0 }}>Overall budget</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          className="inline-cat-input"
          type="number"
          inputMode="decimal"
          placeholder={`e.g. 50000 (${currencySymbol})`}
          value={overallInput}
          onChange={(e) => setOverallInput(e.target.value)}
        />
        <button
          className="inline-cat-btn"
          onClick={() => saveBudget(null, overallInput, 'overall')}
          disabled={savingKey === 'overall'}
        >
          {savingKey === 'overall' ? '…' : 'Save'}
        </button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
        Drives "Budget left" on the dashboard. Alerts trigger at 80% used.
      </p>

      <p className="settings-group-label">Per-category limits (optional)</p>
      {categories.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No categories yet — add some first.</p>
      )}
      {categories.map((c) => (
        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '0.5px solid var(--border)' }}>
          <IconTile label={c.name} size={32} />
          <span style={{ fontSize: 14, flex: 1 }}>{c.name}</span>
          <input
            className="inline-cat-input"
            style={{ width: 100, flex: 'none' }}
            type="number"
            inputMode="decimal"
            placeholder={currencySymbol}
            value={catInputs[c.id] || ''}
            onChange={(e) => setCatInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
          />
          <button
            className="inline-cat-btn"
            onClick={() => saveBudget(c.id, catInputs[c.id], c.id)}
            disabled={savingKey === c.id}
          >
            {savingKey === c.id ? '…' : 'Save'}
          </button>
        </div>
      ))}
    </div>
  );
}