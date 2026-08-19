// Ledger app icon mark + wordmark lockup. Single-stroke L/checkmark hybrid
// — matches design system's emerald accent and warm off-white (#F2ECDD).
// Wordmark uses the same Georgia serif touch already applied to small
// labels elsewhere ("Total spent", month label) — ties the brand name to
// an existing design decision rather than introducing a new typeface.

export function LogoMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="112" fill="#0B6E4F" />
      <path
        d="M188 132V318C188 329.046 196.954 338 208 338H300L372 250"
        stroke="#F2ECDD"
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function Logo({ size = 32, showWordmark = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <LogoMark size={size} />
      {showWordmark && (
        <span
          style={{
            fontSize: size * 0.6,
            fontWeight: 500,
            color: 'var(--text-primary)',
            fontFamily: "Georgia, 'Times New Roman', serif",
            letterSpacing: '0.2px',
          }}
        >
          Ledger
        </span>
      )}
    </div>
  );
}