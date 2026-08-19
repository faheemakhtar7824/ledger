import { useState } from 'react';
import IconTile from './IconTile';
import { IconChevronDown, IconCheck, IconPlus } from './icons';

// Custom dropdown replacing the native <select>. "Add new category" is
// pinned outside the scrollable list so it's always reachable in one tap
// regardless of how many categories exist.
export default function CategoryPicker({ categories, value, onSelect, onAddNew }) {
  const [open, setOpen] = useState(false);
  const selected = categories.find((c) => c.id === value);

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', border: 'none', background: 'transparent', padding: 0,
          fontSize: 14, color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
          cursor: 'pointer',
        }}
      >
        <span>{selected ? selected.name : 'Select category'}</span>
        <IconChevronDown size={14} color="var(--text-muted)" />
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 50 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: 'var(--surface-2)',
              border: '0.5px solid var(--border)',
              borderRadius: 14,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 51,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 260,
            }}
          >
            {/* Pinned "Add new category" — always visible, not scrollable away */}
            <div
              onClick={() => {
                onAddNew();
                setOpen(false);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '11px 10px', cursor: 'pointer',
                color: 'var(--text-accent)', borderBottom: '0.5px solid var(--border)',
                background: 'var(--surface-2)', flexShrink: 0,
              }}
            >
              <IconPlus size={15} strokeWidth={2} />
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>Add new category</span>
            </div>

            <div
              style={{
                overflowY: 'auto',
                padding: 6,
                // Explicit touch-scroll support — without this, some
                // mobile browsers can fail to scroll a nested container
                // when it sits inside another scrollable/fixed-position
                // ancestor (the bottom sheet), even though overflowY:auto
                // is set.
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                touchAction: 'pan-y',
              }}
            >
              {categories.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '10px 8px' }}>No categories yet</p>
              )}

              {categories.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelect(c.id);
                    setOpen(false);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 8px', borderRadius: 10, cursor: 'pointer',
                    background: c.id === value ? 'var(--surface-1)' : 'transparent',
                  }}
                >
                  <IconTile label={c.name} size={28} />
                  <span style={{ fontSize: 13.5, color: 'var(--text-primary)', flex: 1 }}>{c.name}</span>
                  {c.id === value && <IconCheck size={15} color="var(--text-accent)" />}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}