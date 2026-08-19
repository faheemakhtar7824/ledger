import { useState } from 'react';
import { useSpace } from '../context/SpaceContext';
import { IconChevronLeft } from './icons';

// Dropdown/sheet pattern per screens-and-flows.md §2 — scales to any
// number of spaces, unlike the old segmented control which stretched
// horizontally and broke past 2-3 spaces.
export default function SpaceSwitcher() {
  const { spaces, activeSpace, switchSpace, createSpace } = useSpace();
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function close() {
    setOpen(false);
    setShowAdd(false);
    setNewName('');
    setError('');
  }

  function handleSelect(spaceId) {
    switchSpace(spaceId);
    close();
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await createSpace(newName.trim());
      close();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create space');
    } finally {
      setSubmitting(false);
    }
  }

  if (!activeSpace) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          border: 'none',
          background: 'var(--surface-1)',
          borderRadius: 10,
          padding: '8px 12px',
          marginBottom: 18,
          cursor: 'pointer',
          maxWidth: '100%',
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: activeSpace.color || '#0B6E4F',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {activeSpace.name}
        </span>
        <span style={{ transform: 'rotate(-90deg)', display: 'flex', color: 'var(--text-muted)' }}>
          <IconChevronLeft size={13} />
        </span>
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
            onClick={close}
          />
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 41,
              maxWidth: 480,
              margin: '0 auto',
              background: 'var(--surface-2)',
              borderRadius: '24px 24px 0 0',
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="sheet-handle" />
            <p className="sheet-title">Switch space</p>

            <div style={{ overflowY: 'auto', padding: '0 18px' }}>
              {spaces.map((space) => (
                <div
                  key={space.id}
                  onClick={() => handleSelect(space.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 4px',
                    borderBottom: '0.5px solid var(--border)',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: space.color || '#0B6E4F',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 14, color: 'var(--text-primary)', flex: 1 }}>{space.name}</span>
                  {space.id === activeSpace.id && (
                    <span style={{ color: 'var(--text-accent)', fontSize: 12, fontWeight: 500 }}>Active</span>
                  )}
                </div>
              ))}
            </div>

            <div style={{ padding: '14px 18px 24px' }}>
              {error && (
                <p style={{ fontSize: 12.5, color: 'var(--text-danger)', marginBottom: 8 }}>{error}</p>
              )}

              {showAdd ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="inline-cat-input"
                    type="text"
                    placeholder="Space name"
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
                  <i className="ti ti-plus"></i>
                  <span>Add new space</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}