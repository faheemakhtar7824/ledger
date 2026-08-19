import { resolveCategoryIcon } from '../lib/categoryIcons';

// Inline SVG icon set — deliberately not using the Tabler webfont, which
// has repeatedly failed to load reliably across this app (confirmed blank
// on Dashboard, Reports, Categories, BudgetSetup at various points). These
// render immediately regardless of any CDN/font issue.

const PATHS = {
  home: <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />,
  kitchen: <><path d="M3 3v18M3 3h4v7a2 2 0 01-4 0V3z" /><path d="M15 3v18M15 3a3 3 0 013 3v4a3 3 0 01-3 3" /></>,
  fuel: <><path d="M3 22h11M6 22V4a1 1 0 011-1h5a1 1 0 011 1v18M6 10h7M16 8l3 2v8a1.5 1.5 0 003 0v-6l-3-3" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-1a5 5 0 015-5h2a5 5 0 015 5v1" /><circle cx="17" cy="8" r="2.5" /><path d="M20 21v-1a4 4 0 00-2.5-3.7" /></>,
  shopping: <><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8V6a3 3 0 016 0v2" /></>,
  bolt: <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />,
  water: <path d="M12 2s7 8 7 13a7 7 0 11-14 0c0-5 7-13 7-13z" />,
  wifi: <><path d="M2 8.5a16 16 0 0120 0M5 12a11 11 0 0114 0M8.5 15.5a6 6 0 017 0" /><circle cx="12" cy="19" r="1" /></>,
  car: <><path d="M3 13l1.5-5A2 2 0 016.4 6.5h11.2a2 2 0 011.9 1.5L21 13v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z" /><circle cx="7" cy="16.5" r="1.5" /><circle cx="17" cy="16.5" r="1.5" /></>,
  health: <><rect x="3" y="9" width="18" height="12" rx="2" /><path d="M8 9V6a4 4 0 018 0v3" /><path d="M12 13v4M10 15h4" /></>,
  book: <><path d="M4 5a2 2 0 012-2h6v18H6a2 2 0 01-2-2V5z" /><path d="M12 3h6a2 2 0 012 2v14a2 2 0 01-2 2h-6" /></>,
  entertainment: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M8 10l3 2-3 2v-4z" /></>,
  tool: <path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2-2 2.5-2.5z" />,
  factory: <><path d="M3 21V10l5 3V10l5 3V10l5 3v8H3z" /><path d="M7 21v-4M12 21v-4M17 21v-4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0116 0v1" /></>,
  gift: <><rect x="3" y="8" width="18" height="13" rx="1" /><path d="M3 12h18M12 8v13" /><path d="M12 8c-2 0-3.5-1-3.5-2.5S9.5 3 11 3c1.5 0 1.5 2.5 1 3M12 8c2 0 3.5-1 3.5-2.5S14.5 3 13 3c-1.5 0-1.5 2.5-1 3" /></>,
  shield: <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" />,
  piggybank: <><path d="M4 12a6 6 0 016-6h4a5 5 0 015 5v1l2 1-2 1v2a1 1 0 01-1 1h-2v2H9v-2a6 6 0 01-5-6z" /><circle cx="15" cy="9" r="0.6" fill="currentColor" /></>,
  tag: <><path d="M20.6 12.6l-8.2 8.2a2 2 0 01-2.8 0l-6.4-6.4a2 2 0 010-2.8l8.2-8.2H18a2 2 0 012 2v7.2z" /><circle cx="15" cy="8" r="1.2" fill="currentColor" /></>,
};

export default function CategoryIcon({ name, size = 16, color = 'var(--text-accent)' }) {
  const key = resolveCategoryIcon(name);
  const path = PATHS[key] || PATHS.tag;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {path}
    </svg>
  );
}