import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IconChevronLeft } from '../components/icons';

// Static informational screen summarizing the app's real security posture,
// drawn directly from 05-security-requirements.md — not filler copy.
const ITEMS = [
  { title: 'Password protection', body: 'Your password is hashed with bcrypt before storage — we never store or can see your actual password.' },
  { title: 'Secure sessions', body: 'Your login session is stored in an HTTP-only cookie, which JavaScript cannot access — this protects you from cross-site scripting attacks.' },
  { title: 'Account lockout', body: 'After 5 failed login attempts, your account locks for 15 minutes to prevent brute-force attacks.' },
  { title: 'Data isolation', body: 'Every request is checked server-side to confirm you own the space, category, or expense you\'re accessing — no one can view or edit your data by guessing an ID.' },
  { title: 'Email verification', body: 'New accounts must verify their email via a one-time code before the account is fully active.' },
];

export default function PrivacySecurity() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 18px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button className="back-btn" onClick={() => navigate('/settings')} aria-label="Back">
          <IconChevronLeft size={18} />
        </button>
        <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Privacy & security</p>
      </div>

      {ITEMS.map((item, i) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}
          style={{
            background: 'var(--surface-1)',
            borderRadius: 14,
            padding: 14,
            marginBottom: 10,
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 4px', color: 'var(--text-primary)' }}>
            {item.title}
          </p>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            {item.body}
          </p>
        </motion.div>
      ))}
    </div>
  );
}