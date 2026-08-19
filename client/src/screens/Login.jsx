import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from '../components/Logo';
import PasswordInput from '../components/PasswordInput';

const PASSWORD_RULES = [
  { label: '8+ characters', test: (p) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Number', test: (p) => /\d/.test(p) },
  { label: 'Special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function Login() {
  const location = useLocation();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: location.state?.email || '',
    password: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const isSignup = mode === 'signup';

  function updateField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function switchMode() {
    setError('');
    setMode(isSignup ? 'login' : 'signup');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isSignup) {
        const res = await signup(form.name, form.username, form.email, form.password);
        navigate('/verify-otp', { state: { email: res.email || form.email, userId: res.userId } });
      } else {
        await login(form.email, form.password);
        navigate('/');
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Something went wrong. Try again.';

      // Unverified accounts get routed straight to Verify OTP (with a
      // working resend button there) instead of a dead-end error message
      // — this was the gap that left users stuck after closing the tab
      // mid-signup with no way back into the verification flow.
      if (message === 'Email not verified') {
        navigate('/verify-otp', { state: { email: form.email } });
        return;
      }

      setError(message);
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

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
          >
            <h1 className="text-xl font-medium text-[var(--text-primary)] mb-1">
              {isSignup ? 'Create account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              {isSignup ? 'Start tracking in seconds' : 'Log in to continue'}
            </p>

            {error && (
              <p className="text-sm text-[var(--text-danger)] mb-3">{error}</p>
            )}

            {isSignup && (
              <>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  autoComplete="name"
                  required
                />
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Username"
                  value={form.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  autoComplete="username"
                  required
                />
              </>
            )}

            <input
              className="auth-input"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              autoComplete="email"
              required
            />
            <PasswordInput
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
            />

            {isSignup && form.password && (
              <ul className="mb-2 space-y-1" style={{ marginTop: 8 }}>
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(form.password);
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

            <button
              type="submit"
              disabled={submitting}
              className="auth-submit"
              style={{ background: 'var(--text-accent)', marginTop: 12 }}
            >
              {submitting ? 'Please wait…' : isSignup ? 'Sign up' : 'Log in'}
            </button>

            {!isSignup && (
              <p className="text-center text-sm mb-4">
                <Link to="/forgot-password" className="text-[var(--text-accent)] font-medium">
                  Forgot password?
                </Link>
              </p>
            )}

            <p className="text-center text-sm text-[var(--text-secondary)]">
              {isSignup ? 'Already have an account?' : 'New here?'}{' '}
              <span
                onClick={switchMode}
                className="text-[var(--text-accent)] font-medium cursor-pointer"
              >
                {isSignup ? 'Log in' : 'Sign up'}
              </span>
            </p>
          </motion.form>
        </AnimatePresence>
      </div>
    </div>
  );
}