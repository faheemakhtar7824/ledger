import { useState } from 'react';

const CURRENCIES = [
  { code: 'PKR', label: 'Pakistani Rupee' },
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'AED', label: 'UAE Dirham' },
  { code: 'SAR', label: 'Saudi Riyal' },
  { code: 'INR', label: 'Indian Rupee' },
];

// Custom bottom-sheet picker — replaces the native <select>, which
// renders with unstyleable browser chrome (blue highlight, white box)
// that clashes with the app's design system.
export default function CurrencyPicker({ current, onSelect, onClose }) {
  const [saving, setSaving] = useState(null); // currency code being saved, or null

  async function handleSelect(code) {
    if (code === current) {
      onClose();
      return;
    }
    setSaving(code);
    try {
      await onSelect(code);
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
          <p className="sheet-title">Choose currency</p>

          <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
            {CURRENCIES.map((c) => (
              <div
                key={c.code}
                onClick={() => handleSelect(c.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 4px',
                  borderBottom: '0.5px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <p style={{ fontSize: 14, margin: 0, color: 'var(--text-primary)', fontWeight: 500 }}>{c.code}</p>
                  <p style={{ fontSize: 12, margin: '2px 0 0', color: 'var(--text-muted)' }}>{c.label}</p>
                </div>
                {c.code === current && (
                  <span style={{ color: 'var(--text-accent)', fontSize: 12, fontWeight: 500 }}>
                    {saving === c.code ? '…' : 'Selected'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}