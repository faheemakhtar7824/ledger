import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from '../components/Logo';
import api from '../lib/api';
import { ENDPOINTS } from '../lib/endpoints';

const OTP_VALIDITY_SECONDS = 10 * 60; // matches backend's 10-minute expiry
const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyOtp() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(OTP_VALIDITY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown for OTP expiry
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Countdown for resend cooldown (prevents spamming the resend button)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = useCallback((total) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  if (!state?.email) {
    return <Navigate to="/login" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
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

  async function handleResend() {
    setError('');
    setInfo('');
    setResending(true);
    try {
      // Signup has no dedicated "resend" endpoint — re-calling signup with
      // the same details isn't viable (would fail as duplicate). Instead
      // this reuses forgot-password's OTP-issuing pattern isn't right
      // either, since this is email-verification, not password reset.
      // The correct backend call is a resend-specific endpoint — added
      // below in auth.js.
      await api.post(ENDPOINTS.auth.resendVerification, { email: state.email });
      setInfo('A new code has been sent.');
      setSecondsLeft(OTP_VALIDITY_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  }

  const expired = secondsLeft <= 0;

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
          <p className="text-xs text-[var(--text-muted)] mb-1">
            Don't see it? Check your spam or junk folder — it can take a minute to arrive.
          </p>
          <p
            className="text-xs mb-6"
            style={{ color: expired ? 'var(--text-danger)' : 'var(--text-muted)' }}
          >
            {expired ? 'This code has expired.' : `Code expires in ${formatTime(secondsLeft)}`}
          </p>

          {error && <p className="text-sm text-[var(--text-danger)] mb-3">{error}</p>}
          {info && <p className="text-sm text-[var(--text-accent)] mb-3">{info}</p>}

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

          <button
            type="submit"
            disabled={submitting || expired}
            className="auth-submit"
            style={{ background: 'var(--text-accent)' }}
          >
            {submitting ? 'Verifying…' : 'Verify'}
          </button>

          <p className="text-center text-sm text-[var(--text-secondary)]">
            {resendCooldown > 0 ? (
              <span>Resend available in {resendCooldown}s</span>
            ) : (
              <span
                onClick={resending ? undefined : handleResend}
                className="text-[var(--text-accent)] font-medium cursor-pointer"
              >
                {resending ? 'Sending…' : 'Resend code'}
              </span>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}