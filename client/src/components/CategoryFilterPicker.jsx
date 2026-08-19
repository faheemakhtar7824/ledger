import { useState } from 'react';
import IconTile from './IconTile';
import { IconChevronDown, IconCheck } from './icons';

// Same custom-dropdown pattern as CategoryPicker, but includes an
// "All categories" option and no "add new" — used for filtering, not
// selecting a category to assign to an expense.
export default function CategoryFilterPicker({ categories, value, onSelect }) {
  const [open, setOpen] = useState(false);
  const selected = categories.find((c) => c.id === value);
  const label = value ? selected?.name : 'All categories';

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="auth-input"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-primary)',
        }}
      >
        <span>{label}</span>
        <IconChevronDown size={14} color="var(--text-muted)" />
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              background: 'var(--surface-2)', border: '0.5px solid var(--border)',
              borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              maxHeight: 260, overflowY: 'auto', zIndex: 51, padding: 6,
            }}
          >
            <div
              onClick={() => { onSelect(''); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px',
                borderRadius: 10, cursor: 'pointer',
                background: !value ? 'var(--surface-1)' : 'transparent',
              }}
            >
              <span style={{ fontSize: 13.5, color: 'var(--text-primary)', flex: 1 }}>All categories</span>
              {!value && <IconCheck size={15} color="var(--text-accent)" />}
            </div>

            {categories.map((c) => (
              <div
                key={c.id}
                onClick={() => { onSelect(c.id); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px',
                  borderRadius: 10, cursor: 'pointer',
                  background: c.id === value ? 'var(--surface-1)' : 'transparent',
                }}
              >
                <IconTile label={c.name} size={28} />
                <span style={{ fontSize: 13.5, color: 'var(--text-primary)', flex: 1 }}>{c.name}</span>
                {c.id === value && <IconCheck size={15} color="var(--text-accent)" />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}