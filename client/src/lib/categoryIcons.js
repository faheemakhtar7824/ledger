// Keyword-matching icon assignment per 01-product-brief.md "Category icons
// — smart defaults, no manual effort required". Maps a category name to
// one of a small set of icon keys via keyword matching, falling back to a
// generic tag icon for anything unmatched. Returns a KEY, not a Tabler
// class — actual rendering happens via inline SVGs in CategoryIcon.jsx,
// since the Tabler webfont has proven unreliable across this app.

const KEYWORD_MAP = [
  { keywords: ['rent', 'home', 'house', 'flat', 'mortgage'], icon: 'home' },
  { keywords: ['food', 'grocery', 'groceries', 'kitchen', 'restaurant', 'dining'], icon: 'kitchen' },
  { keywords: ['fuel', 'petrol', 'gas', 'diesel'], icon: 'fuel' },
  { keywords: ['salary', 'wage', 'payroll', 'staff', 'employee'], icon: 'users' },
  { keywords: ['shopping', 'clothes', 'clothing', 'apparel', 'fabric'], icon: 'shopping' },
  { keywords: ['utility', 'utilities', 'electricity', 'bolt', 'power', 'bill'], icon: 'bolt' },
  { keywords: ['water'], icon: 'water' },
  { keywords: ['internet', 'wifi', 'phone', 'mobile', 'telecom'], icon: 'wifi' },
  { keywords: ['transport', 'fare', 'travel', 'commute', 'taxi', 'uber', 'bus'], icon: 'car' },
  { keywords: ['health', 'medical', 'medicine', 'doctor', 'hospital', 'pharmacy'], icon: 'health' },
  { keywords: ['education', 'school', 'tuition', 'course', 'book'], icon: 'book' },
  { keywords: ['entertainment', 'movie', 'game', 'fun', 'subscription', 'netflix'], icon: 'entertainment' },
  { keywords: ['maintenance', 'repair', 'tool'], icon: 'tool' },
  { keywords: ['factory', 'production', 'manufacturing'], icon: 'factory' },
  { keywords: ['personal', 'self', 'misc', 'miscellaneous'], icon: 'user' },
  { keywords: ['gift', 'donation', 'charity'], icon: 'gift' },
  { keywords: ['insurance'], icon: 'shield' },
  { keywords: ['savings', 'saving', 'investment'], icon: 'piggybank' },
];

export function resolveCategoryIcon(name) {
  if (!name) return 'tag';
  const lower = name.toLowerCase();
  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.icon;
    }
  }
  return 'tag'; // generic neutral fallback — never blank, never blocks saving
}