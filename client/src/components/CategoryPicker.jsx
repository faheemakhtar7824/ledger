import { useState } from 'react';
import IconTile from './IconTile';
import { IconCheck, IconPlus, IconChevronDown } from './icons';

// Renders as a full bottom sheet (same pattern as CurrencyPicker/
// SpaceSwitcher) instead of an inline dropdown anchored to the field —
// the inline dropdown ran out of vertical room and became unscrollable
// once the field sat near the bottom of an already-tall Add Expense
// sheet. A dedicated sheet always has full screen height to work with.
export default function CategoryPicker({ categories, value, onSelect, onAddNew }) {
  const [open, setOpen] = useState(false);
  const selected = categories.find((c) => c.id === value);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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
          <div className="sheet-backdrop" style={{ zIndex: 60 }} onClick={() => setOpen(false)} />
          <div className="sheet-container" style={{ zIndex: 61 }}>
            <div className="sheet-content" style={{ maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
              <div className="sheet-handle" />
              <p className="sheet-title">Choose category</p>

              <div
                onClick={() => {
                  onAddNew();
                  setOpen(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '11px 4px', cursor: 'pointer',
                  color: 'var(--text-accent)', borderBottom: '0.5px solid var(--border)',
                  marginBottom: 6, flexShrink: 0,
                }}
              >
                <IconPlus size={16} strokeWidth={2} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>Add new category</span>
              </div>

              <div
                style={{
                  overflowY: 'auto',
                  flex: 1,
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                }}
              >
                {categories.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '10px 4px' }}>No categories yet</p>
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
                      padding: '11px 4px', borderRadius: 10, cursor: 'pointer',
                      background: c.id === value ? 'var(--surface-1)' : 'transparent',
                    }}
                  >
                    <IconTile label={c.name} size={30} />
                    <span style={{ fontSize: 14, color: 'var(--text-primary)', flex: 1 }}>{c.name}</span>
                    {c.id === value && <IconCheck size={16} color="var(--text-accent)" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}