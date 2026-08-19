import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from '../components/Logo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await forgotPassword(email);
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] px-6">
      <div className="w-full max-w-sm">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <LogoMark size={130} />
        </div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          <h1 className="text-xl font-medium text-[var(--text-primary)] mb-1">Reset password</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Enter your email and we'll send you a reset code
          </p>

          {error && <p className="text-sm text-[var(--text-danger)] mb-3">{error}</p>}

          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" disabled={submitting} className="auth-submit" style={{ background: 'var(--text-accent)' }}>
            {submitting ? 'Sending…' : 'Send reset code'}
          </button>

          <p className="text-center text-sm text-[var(--text-secondary)]">
            <Link to="/login" className="text-[var(--text-accent)] font-medium">Back to login</Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}