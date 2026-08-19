import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSpace } from '../context/SpaceContext';
import Avatar from '../components/Avatar';
import ThemeToggleSwitch from '../components/ThemeToggleSwitch';
import CurrencyPicker from '../components/CurrencyPicker';
import {
  IconChevronLeft, IconChevronRight, IconTrash, IconPlus,
  IconCurrency, IconBell, IconChartBar, IconLock, IconLogout,
} from '../components/icons';

export default function Settings() {
  const { user, logout, updateCurrency } = useAuth();
  const { spaces, activeSpaceId, switchSpace, createSpace, deleteSpace } = useSpace();
  const navigate = useNavigate();

  const [showAddSpace, setShowAddSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  async function handleAddSpace() {
    if (!newSpaceName.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await createSpace(newSpaceName.trim());
      setNewSpaceName('');
      setShowAddSpace(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create space');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteSpace(spaceId) {
    setDeleting(true);
    setError('');
    try {
      await deleteSpace(spaceId);
      setConfirmingDeleteId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete space');
    } finally {
      setDeleting(false);
    }
  }

  async function handleCurrencySelect(code) {
    try {
      await updateCurrency(code);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update currency');
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 18px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <button className="back-btn" onClick={() => navigate('/')} aria-label="Back">
          <IconChevronLeft size={18} />
        </button>
        <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Settings</p>
      </div>

      <div className="settings-header">
        <Avatar name={user?.name} size={56} />
        <div>
          <p className="settings-name">{user?.name}</p>
          <p className="settings-sub">{user?.email}</p>
        </div>
      </div>

      <p className="settings-group-label">Spaces</p>
      {spaces.map((space) => (
        <div key={space.id}>
          <div className="space-chip">
            <span className="space-dot" style={{ background: space.color || '#0B6E4F' }}></span>
            <span
              className="settings-row-label"
              style={{ cursor: 'pointer' }}
              onClick={() => switchSpace(space.id)}
            >
              {space.name}
              {space.id === activeSpaceId && (
                <span style={{ color: 'var(--text-accent)', fontSize: 12, marginLeft: 6 }}>· Active</span>
              )}
            </span>
            {spaces.length > 1 && (
              <button
                onClick={() => setConfirmingDeleteId(space.id)}
                aria-label="Delete space"
                style={{
                  width: 28, height: 28, borderRadius: '50%', border: 'none',
                  background: 'var(--surface-1)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', color: 'var(--text-danger)',
                  flexShrink: 0,
                }}
              >
                <IconTrash size={13} />
              </button>
            )}
          </div>

          {confirmingDeleteId === space.id && (
            <div style={{ background: 'var(--surface-1)', borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                This will permanently delete "{space.name}" along with everything in it — all categories and expenses. This can't be undone.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setConfirmingDeleteId(null)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 10, border: '0.5px solid var(--border)',
                    background: 'transparent', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteSpace(space.id)}
                  disabled={deleting}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 10, border: 'none',
                    background: 'var(--text-danger)', color: '#fff', fontSize: 13,
                    fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  {deleting ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {error && (
        <p style={{ fontSize: 13, color: 'var(--text-danger)', margin: '6px 0' }}>{error}</p>
      )}

      {showAddSpace ? (
        <div style={{ display: 'flex', gap: 8, padding: '10px 0' }}>
          <input
            className="inline-cat-input"
            type="text"
            placeholder="Space name"
            value={newSpaceName}
            onChange={(e) => setNewSpaceName(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAddSpace()}
          />
          <button className="inline-cat-btn" onClick={handleAddSpace} disabled={submitting}>
            {submitting ? '…' : 'Add'}
          </button>
        </div>
      ) : (
        <div className="add-cat-btn" style={{ paddingTop: 8 }} onClick={() => setShowAddSpace(true)}>
          <IconPlus size={18} strokeWidth={2} />
          <span>Add space</span>
        </div>
      )}

      <p className="settings-group-label">Appearance</p>
      <ThemeToggleSwitch />

      <p className="settings-group-label">Preferences</p>

      <div className="settings-row" style={{ cursor: 'pointer' }} onClick={() => setShowCurrencyPicker(true)}>
        <IconCurrency size={17} color="var(--text-accent)" />
        <span className="settings-row-label">Currency</span>
        <span className="settings-row-value">{user?.currencyPreference || 'PKR'}</span>
        <IconChevronRight size={15} color="var(--text-muted)" />
      </div>

      <div className="settings-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/budget')}>
        <IconBell size={17} color="var(--text-accent)" />
        <span className="settings-row-label">Budget</span>
        <IconChevronRight size={15} color="var(--text-muted)" />
      </div>

      <p className="settings-group-label">Data</p>

      <div className="settings-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/reports')}>
        <IconChartBar size={17} color="var(--text-accent)" />
        <span className="settings-row-label">Reports</span>
        <IconChevronRight size={15} color="var(--text-muted)" />
      </div>

      <div className="settings-row" style={{ borderBottom: 'none', cursor: 'pointer' }} onClick={() => navigate('/privacy')}>
        <IconLock size={17} color="var(--text-accent)" />
        <span className="settings-row-label">Privacy and security</span>
        <IconChevronRight size={15} color="var(--text-muted)" />
      </div>

      <p className="settings-group-label">Account</p>
      <div
        className="settings-row"
        style={{ borderBottom: 'none', cursor: 'pointer' }}
        onClick={handleLogout}
      >
        <IconLogout size={17} color="var(--text-danger)" />
        <span className="settings-row-label" style={{ color: 'var(--text-danger)' }}>Log out</span>
      </div>

      {showCurrencyPicker && (
        <CurrencyPicker
          current={user?.currencyPreference || 'PKR'}
          onSelect={handleCurrencySelect}
          onClose={() => setShowCurrencyPicker(false)}
        />
      )}
    </div>
  );
}