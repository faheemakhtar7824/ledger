import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSpace } from '../context/SpaceContext';
import { IconChevronLeft, IconTrash } from '../components/icons';
import Avatar from '../components/Avatar';
import ThemeToggleSwitch from '../components/ThemeToggleSwitch';
import CurrencyPicker from '../components/CurrencyPicker';
import RetentionPicker from '../components/RetentionPicker';
import DeleteAccountSheet from '../components/DeleteAccountSheet';

function retentionLabel(months) {
  if (months === null || months === undefined) return 'Never';
  if (months === 6) return '6 months';
  if (months === 12) return '1 year';
  if (months === 24) return '2 years';
  if (months === 36) return '3 years';
  return `${months} months`;
}

export default function Settings() {
  const { user, logout, updateCurrency, updateRetention, deleteAccount } = useAuth();
  const { spaces, activeSpaceId, switchSpace, createSpace, deleteSpace } = useSpace();
  const navigate = useNavigate();

  const [showAddSpace, setShowAddSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showRetentionPicker, setShowRetentionPicker] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

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

  async function handleRetentionSelect(months) {
    try {
      await updateRetention(months);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update setting');
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  async function handleDeleteAccount(password) {
    await deleteAccount(password);
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
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--surface-1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-danger)',
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
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 10,
                    border: '0.5px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteSpace(space.id)}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 10,
                    border: 'none',
                    background: 'var(--text-danger)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {deleting ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {error && <p style={{ fontSize: 13, color: 'var(--text-danger)', margin: '6px 0' }}>{error}</p>}

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
          <i className="ti ti-plus"></i>
          <span>Add space</span>
        </div>
      )}

      <p className="settings-group-label">Appearance</p>
      <ThemeToggleSwitch />

      <p className="settings-group-label">Preferences</p>

      <div className="settings-row" style={{ cursor: 'pointer' }} onClick={() => setShowCurrencyPicker(true)}>
        <i className="ti ti-currency-rupee"></i>
        <span className="settings-row-label">Currency</span>
        <span className="settings-row-value">{user?.currencyPreference || 'PKR'}</span>
        <i className="ti ti-chevron-right"></i>
      </div>

      <div className="settings-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/budget')}>
        <i className="ti ti-bell"></i>
        <span className="settings-row-label">Budget</span>
        <i className="ti ti-chevron-right"></i>
      </div>

      <div className="settings-row" style={{ cursor: 'pointer' }} onClick={() => setShowRetentionPicker(true)}>
        <i className="ti ti-clock"></i>
        <span className="settings-row-label">Auto-delete old expenses</span>
        <span className="settings-row-value">{retentionLabel(user?.expenseRetentionMonths)}</span>
        <i className="ti ti-chevron-right"></i>
      </div>

      <p className="settings-group-label">Data</p>

      <div className="settings-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/reports')}>
        <i className="ti ti-chart-bar"></i>
        <span className="settings-row-label">Reports</span>
        <i className="ti ti-chevron-right"></i>
      </div>

      <div className="settings-row" style={{ borderBottom: 'none', cursor: 'pointer' }} onClick={() => navigate('/privacy')}>
        <i className="ti ti-lock"></i>
        <span className="settings-row-label">Privacy and security</span>
        <i className="ti ti-chevron-right"></i>
      </div>

      <p className="settings-group-label">Account</p>
      <div className="settings-row" style={{ cursor: 'pointer' }} onClick={handleLogout}>
        <i className="ti ti-logout" style={{ color: 'var(--text-danger)' }}></i>
        <span className="settings-row-label" style={{ color: 'var(--text-danger)' }}>
          Log out
        </span>
      </div>

      <div
        className="settings-row"
        style={{ borderBottom: 'none', cursor: 'pointer' }}
        onClick={() => setShowDeleteAccount(true)}
      >
        <IconTrash size={17} color="var(--text-danger)" />
        <span className="settings-row-label" style={{ color: 'var(--text-danger)' }}>
          Delete account
        </span>
      </div>

      {showCurrencyPicker && (
        <CurrencyPicker
          current={user?.currencyPreference || 'PKR'}
          onSelect={handleCurrencySelect}
          onClose={() => setShowCurrencyPicker(false)}
        />
      )}

      {showRetentionPicker && (
        <RetentionPicker
          current={user?.expenseRetentionMonths}
          onSelect={handleRetentionSelect}
          onClose={() => setShowRetentionPicker(false)}
        />
      )}

      {showDeleteAccount && (
        <DeleteAccountSheet
          onConfirm={handleDeleteAccount}
          onClose={() => setShowDeleteAccount(false)}
        />
      )}
    </div>
  );
}