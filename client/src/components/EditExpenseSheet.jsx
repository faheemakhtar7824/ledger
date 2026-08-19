import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { ENDPOINTS } from '../lib/endpoints';
import { useSpace } from '../context/SpaceContext';
import { useAuth } from '../context/AuthContext';
import { getCurrencySymbol } from '../lib/currency';
import CategoryPicker from './CategoryPicker';
import { IconCalendarSmall, IconNoteSmall, IconShapes } from './icons';

export default function EditExpenseSheet({ open, expense, onClose, onSaved, onDeleted }) {
  const { activeSpaceId } = useSpace();
  const { user } = useAuth();
  const symbol = getCurrencySymbol(user?.currencyPreference || 'PKR');

  const [amount, setAmount] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open || !expense || !activeSpaceId) return;
    setAmount(String(expense.amount));
    setCategoryId(expense.categoryId || expense.category?.id || '');
    setDate(new Date(expense.date).toISOString().slice(0, 10));
    setNote(expense.note || '');
    setError('');
    setConfirmingDelete(false);

    api
      .get(ENDPOINTS.categories.base(activeSpaceId))
      .then((res) => setCategories(res.data))
      .catch(() => setError('Failed to load categories'));
  }, [open, expense, activeSpaceId]);

  async function handleSave() {
    setError('');
    const parsedAmount = Number(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (!categoryId) {
      setError('Select a category');
      return;
    }

    setSubmitting(true);
    try {
      await api.put(ENDPOINTS.expenses.byId(activeSpaceId, expense.id), {
        categoryId,
        amount: parsedAmount,
        date,
        note: note.trim() || null,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update expense');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError('');
    try {
      await api.delete(ENDPOINTS.expenses.byId(activeSpaceId, expense.id));
      onDeleted?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete expense');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && expense && (
        <>
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="sheet-container"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="sheet-content">
              <div className="sheet-handle" />
              <p className="sheet-title">Edit expense</p>

              <input
                className="amount-input"
                type="number"
                inputMode="decimal"
                placeholder={`${symbol} 0`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              {error && (
                <p style={{ color: 'var(--text-danger)', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
                  {error}
                </p>
              )}

              <div className="field-row">
                <IconShapes size={18} color="var(--text-secondary)" />
                <span className="field-label">Category</span>
                <CategoryPicker
                  categories={categories}
                  value={categoryId}
                  onSelect={setCategoryId}
                  onAddNew={() => {}}
                />
              </div>

              <div className="field-row">
                <IconCalendarSmall size={18} color="var(--text-secondary)" />
                <span className="field-label">Date</span>
                <input
                  type="date"
                  className="field-value"
                  style={{ border: 'none', background: 'transparent', flex: 1 }}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="field-row" style={{ borderBottom: 'none' }}>
                <IconNoteSmall size={18} color="var(--text-secondary)" />
                <span className="field-label">Note</span>
                <input
                  type="text"
                  className="field-value"
                  style={{ border: 'none', background: 'transparent', flex: 1 }}
                  placeholder="Add a note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                />
              </div>

              <button className="save-btn" onClick={handleSave} disabled={submitting}>
                {submitting ? 'Saving…' : 'Save changes'}
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
                  Delete expense
                </button>
              ) : (
                <div style={{ marginTop: 10, textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Delete this expense? This can't be undone.
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}