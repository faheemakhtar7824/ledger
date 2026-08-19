// Single source of truth for the user avatar — circular, initials only,
// matches mockup's .settings-avatar pattern exactly (background
// var(--surface-1), text var(--text-accent)). No emoji customization —
// removed per design feedback to match the mockup precisely.
export default function Avatar({ name, size = 32, fontSize }) {
  const initials = (name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className="avatar-circle"
      style={{
        width: size,
        height: size,
        fontSize: fontSize || Math.round(size * 0.42),
      }}
    >
      {initials}
    </div>
  );
}