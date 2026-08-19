import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { ENDPOINTS } from '../lib/endpoints';
import { useSpace } from '../context/SpaceContext';
import { useAuth } from '../context/AuthContext';
import { getCurrencySymbol } from '../lib/currency';
import CategoryPicker from './CategoryPicker';
import { IconCalendarSmall, IconNoteSmall, IconShapes } from './icons';

export default function AddExpenseSheet({ open, onClose, onSaved }) {
  const { activeSpaceId } = useSpace();
  const { user } = useAuth();
  const symbol = getCurrencySymbol(user?.currencyPreference || 'PKR');

  const [amount, setAmount] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !activeSpaceId) return;
    api
      .get(ENDPOINTS.categories.base(activeSpaceId))
      .then((res) => {
        setCategories(res.data);
        if (res.data.length > 0) setCategoryId(res.data[0].id);
      })
      .catch(() => setError('Failed to load categories'));
  }, [open, activeSpaceId]);

  useEffect(() => {
    if (open) {
      setAmount('');
      setNote('');
      setDate(new Date().toISOString().slice(0, 10));
      setShowNewCategory(false);
      setNewCategoryName('');
      setError('');
    }
  }, [open]);

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    try {
      const res = await api.post(ENDPOINTS.categories.base(activeSpaceId), {
        name: newCategoryName.trim(),
      });
      setCategories((prev) => [...prev, res.data]);
      setCategoryId(res.data.id);
      setShowNewCategory(false);
      setNewCategoryName('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create category');
    }
  }

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
      await api.post(ENDPOINTS.expenses.base(activeSpaceId), {
        categoryId,
        amount: parsedAmount,
        date,
        note: note.trim() || undefined,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
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
              <p className="sheet-title">Add expense</p>

              <input
                className="amount-input"
                type="number"
                inputMode="decimal"
                placeholder={`${symbol} 0`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />

              {error && (
                <p style={{ color: 'var(--text-danger)', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
                  {error}
                </p>
              )}

              <div className="field-row">
                <IconShapes size={18} color="var(--text-secondary)" />
                <span className="field-label">Category</span>
                {showNewCategory ? (
                  <div style={{ flex: 1, display: 'flex', gap: 6 }}>
                    <input
                      className="inline-cat-input"
                      type="text"
                      placeholder="New category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      autoFocus
                    />
                    <button className="inline-cat-btn" onClick={handleCreateCategory}>Add</button>
                  </div>
                ) : (
                  <CategoryPicker
                    categories={categories}
                    value={categoryId}
                    onSelect={setCategoryId}
                    onAddNew={() => setShowNewCategory(true)}
                  />
                )}
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
                {submitting ? 'Saving…' : 'Save expense'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}