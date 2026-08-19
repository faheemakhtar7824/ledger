import { useTheme } from '../context/ThemeContext';

// Explicit Light/Dark/System segmented toggle.
export default function ThemeToggleSwitch() {
  const { preference, setPreference } = useTheme();
  const options = [
    { value: 'light', icon: 'ti-sun', label: 'Light' },
    { value: 'dark', icon: 'ti-moon', label: 'Dark' },
    { value: 'system', icon: 'ti-device-desktop', label: 'System' },
  ];

  return (
    <div className="seg-wrap" style={{ width: '100%' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`seg ${preference === opt.value ? 'active' : ''}`}
          onClick={() => setPreference(opt.value)}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
        >
          <i className={`ti ${opt.icon}`} style={{ fontSize: 13 }}></i>
          {opt.label}
        </button>
      ))}
    </div>
  );
}