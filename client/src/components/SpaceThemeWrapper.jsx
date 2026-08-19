import { useSpace } from '../context/SpaceContext';

function spaceThemeClass(space) {
  if (!space) return 'space-business';
  return space.name.toLowerCase().includes('personal') ? 'space-personal' : 'space-business';
}

// Wraps the whole authenticated app so every screen — not just Dashboard —
// gets the correct accent color for the active space.
export default function SpaceThemeWrapper({ children }) {
  const { activeSpace } = useSpace();
  return (
    <div className={spaceThemeClass(activeSpace)} style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      {children}
    </div>
  );
}