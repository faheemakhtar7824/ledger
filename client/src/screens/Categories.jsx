import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { ENDPOINTS } from '../lib/endpoints';
import { useSpace } from '../context/SpaceContext';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../lib/currency';
import IconTile from '../components/IconTile';
import { IconChevronLeft, IconPencil, IconPlus } from '../components/icons';

export default function Categories() {
  const { activeSpace, activeSpaceId } = useSpace();
  const { user } = useAuth();
  const currency = user?.currencyPreference || 'PKR';
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [spend, setSpend] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!activeSpaceId) return;
    setLoading(true);
    setError('');
    try {
      const [catsRes, breakdownRes] = await Promise.all([
        api.get(ENDPOINTS.categories.base(activeSpaceId)),
        api.get(ENDPOINTS.reports.categoryBreakdown(activeSpaceId)),
      ]);
      setCategories(catsRes.data);
      const spendMap = Object.fromEntries(breakdownRes.data.map((b) => [b.categoryId, b.total]));
      setSpend(spendMap);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [activeSpaceId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd() {
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      await api.post(ENDPOINTS.categories.base(activeSpaceId), { name: newName.trim() });
      setNewName('');
      setShowAdd(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(e, cat) {
    e.stopPropagation();
    setEditingCategory(cat);
    setEditName(cat.name);
    setConfirmingDelete(false);
  }

  async function saveEdit() {
    if (!editName.trim()) return;
    setSavingEdit(true);
    setError('');
    try {
      await api.put(ENDPOINTS.categories.byId(activeSpaceId, editingCategory.id), {
        name: editName.trim(),
      });
      setEditingCategory(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update category');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError('');
    try {
      await api.delete(ENDPOINTS.categories.byId(activeSpaceId, editingCategory.id));
      setEditingCategory(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete category');
    } finally {
      setDeleting(false);
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
        <button className="back-btn" onClick={() => navigate('/')} aria-label="Back">
          <IconChevronLeft size={18} />
        </button>
        <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Categories</p>
      </div>
      <p className="label-serif" style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 14px' }}>
        {activeSpace?.name}
      </p>

      {error && <p style={{ fontSize: 13, color: 'var(--text-danger)', marginBottom: 12 }}>{error}</p>}

      {categories.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          No categories yet — add one below.
        </p>
      )}

      {categories.map((c) => (
        <div
          key={c.id}
          className="cat-manage-row"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/categories/${c.id}`)}
        >
          <IconTile label={c.name} size={38} />
          <div className="cat-manage-body">
            <p className="cat-manage-name">{c.name}</p>
            <p className="cat-manage-spend">{formatMoney(spend[c.id] || 0, currency)} this month</p>
          </div>
          <button
            onClick={(e) => openEdit(e, c)}
            aria-label="Edit category"
            style={{
              width: 30, height: 30, borderRadius: '50%', border: 'none',
              background: 'var(--surface-1)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)',
              flexShrink: 0,
            }}
          >
            <IconPencil size={14} />
          </button>
        </div>
      ))}

      {showAdd ? (
        <div style={{ display: 'flex', gap: 8, padding: '13px 0' }}>
          <input
            className="inline-cat-input"
            type="text"
            placeholder="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button className="inline-cat-btn" onClick={handleAdd} disabled={submitting}>
            {submitting ? '…' : 'Add'}
          </button>
        </div>
      ) : (
        <div className="add-cat-btn" onClick={() => setShowAdd(true)}>
          <IconPlus size={18} strokeWidth={2} />
          <span>Add category</span>
        </div>
      )}

      {editingCategory && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
            onClick={() => setEditingCategory(null)}
          />
          <div
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 41,
              maxWidth: 480, margin: '0 auto', background: 'var(--surface-2)',
              borderRadius: '24px 24px 0 0', padding: '20px 18px 28px',
            }}
          >
            <div className="sheet-handle" />
            <p className="sheet-title">Edit category</p>

            <input
              className="auth-input"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />

            <button className="save-btn" onClick={saveEdit} disabled={savingEdit}>
              {savingEdit ? 'Saving…' : 'Save changes'}
            </button>

            {!confirmingDelete ? (
              <button
                onClick={() => setConfirmingDelete(true)}
                style={{
                  width: '100%', marginTop: 10, padding: '12px 0', border: 'none',
                  background: 'transparent', color: 'var(--text-danger)',
                  fontSize: 14, fontWeight: 500, cursor: 'pointer',
                }}
              >
                Delete category
              </button>
            ) : (
              <div style={{ marginTop: 10, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Delete this category? All its expenses will be deleted too — this can't be undone.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 12, border: '0.5px solid var(--border)',
                      background: 'transparent', color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
                      background: 'var(--text-danger)', color: '#fff', fontSize: 14,
                      fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    {deleting ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}