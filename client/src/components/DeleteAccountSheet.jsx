import { useState } from 'react';
import PasswordInput from './PasswordInput';

export default function DeleteAccountSheet({ onConfirm, onClose }) {
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError('');

    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      setError('Type DELETE exactly to confirm');
      return;
    }
    if (!password) {
      setError('Enter your password');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(password);
    } catch (err) {
      console.error('Delete account error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to delete account');
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet-container">
        <div className="sheet-content">
          <div className="sheet-handle" />
          <p className="sheet-title">Delete account</p>

          <div
            style={{
              background: 'color-mix(in srgb, var(--text-danger) 10%, var(--surface-1))',
              border: '0.5px solid var(--text-danger)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 20,
            }}
          >
            <p style={{ fontSize: 13, color: 'var(--text-danger)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
              This permanently deletes your account and everything in it — every Space, category, expense, and budget. This cannot be undone.
            </p>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: 'var(--text-danger)', marginBottom: 12 }}>{error}</p>
          )}

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Type <strong>DELETE</strong> to confirm
          </p>
          <input
            className="auth-input"
            type="text"
            placeholder="DELETE"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, marginTop: 4 }}>
            Enter your password
          </p>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%',
              marginTop: 16,
              padding: '14px 0',
              border: 'none',
              borderRadius: 14,
              background: 'var(--text-danger)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 500,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? 'Deleting…' : 'Permanently delete my account'}
          </button>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              marginTop: 10,
              padding: '12px 0',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}