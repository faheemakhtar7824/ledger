import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from '../components/Logo';

export default function VerifyOtp() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!state?.email) {
    return <Navigate to="/login" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await verifyOtp(state.email, code);
      navigate('/login', { state: { email: res.email || state.email } });
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Try again.');
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

        <form onSubmit={handleSubmit}>
          <h1 className="text-xl font-medium text-[var(--text-primary)] mb-1">Verify your email</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-1">
            Enter the code sent to {state.email}
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-6">
            Don't see it? Check your spam or junk folder — it can take a minute to arrive.
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

          <button type="submit" disabled={submitting} className="auth-submit" style={{ background: 'var(--text-accent)' }}>
            {submitting ? 'Verifying…' : 'Verify'}
          </button>
        </form>
      </div>
    </div>
  );
}