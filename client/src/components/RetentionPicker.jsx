import { useState } from 'react';

const OPTIONS = [
  { months: 6, label: '6 months' },
  { months: 12, label: '1 year' },
  { months: 24, label: '2 years' },
  { months: 36, label: '3 years' },
  { months: null, label: 'Never' },
];

// Bottom sheet for choosing how long expenses are kept before automatic
// deletion. Strictly opt-in per-user, default is 3 years (set server-side
// on signup), "Never" is always available and fully respected.
export default function RetentionPicker({ current, onSelect, onClose }) {
  const [saving, setSaving] = useState(null);

  async function handleSelect(months) {
    setSaving(months);
    try {
      await onSelect(months);
    } finally {
      setSaving(null);
      onClose();
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet-container">
        <div className="sheet-content">
          <div className="sheet-handle" />
          <p className="sheet-title">Auto-delete old expenses</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', textAlign: 'center', margin: '-14px 0 20px' }}>
            Expenses older than this will be permanently deleted. This can't be undone.
          </p>

          {OPTIONS.map((opt) => (
            <div
              key={opt.label}
              onClick={() => handleSelect(opt.months)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '13px 4px',
                borderBottom: '0.5px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{opt.label}</span>
              {opt.months === current && (
                <span style={{ color: 'var(--text-accent)', fontSize: 12, fontWeight: 500 }}>
                  {saving === opt.months ? '…' : 'Selected'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}