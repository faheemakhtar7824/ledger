import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from '../components/Logo';
import PasswordInput from '../components/PasswordInput';

const PASSWORD_RULES = [
  { label: '8+ characters', test: (p) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Number', test: (p) => /\d/.test(p) },
  { label: 'Special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function ResetPassword() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!state?.email) {
    return <Navigate to="/forgot-password" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await resetPassword(state.email, code, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login', { state: { email: state.email } }), 1600);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] px-6">
      <div className="w-full max-w-sm">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <LogoMark size={130} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              style={{ textAlign: 'center' }}
            >
              <div
                style={{
                  width: 56, height: 56, borderRadius: '50%', background: 'var(--text-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--surface-2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-base font-medium text-[var(--text-primary)]">Password reset</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Redirecting to login…</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h1 className="text-xl font-medium text-[var(--text-primary)] mb-1">Enter reset code</h1>
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                Sent to {state.email}
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-6">
                Don't see it? Check your spam or junk folder.
              </p>

              {error && <p className="text-sm text-[var(--text-danger)] mb-3">{error}</p>}

              <input
                className="auth-input"
                type="text"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                autoComplete="one-time-code"
                required
              />
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
                required
              />

              {newPassword && (
                <ul className="mb-2 space-y-1" style={{ marginTop: 8 }}>
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(newPassword);
                    return (
                      <li
                        key={rule.label}
                        className={`text-xs flex items-center gap-1.5 ${
                          passed ? 'text-[var(--text-accent)]' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        <span>{passed ? '✓' : '·'}</span>
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              )}

              <button type="submit" disabled={submitting} className="auth-submit" style={{ background: 'var(--text-accent)', marginTop: 12 }}>
                {submitting ? 'Resetting…' : 'Reset password'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}