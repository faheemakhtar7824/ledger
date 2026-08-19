import CategoryIcon from './CategoryIcon';

// Category/transaction icon tile — real keyword-matched icons now
// (product-brief §"Category icons"), not a letter fallback. Matches
// mockup's .icon-tile exactly: 34px default, 10px radius, surface-1 bg,
// icon in text-accent.
export default function IconTile({ label, size = 34, iconSize }) {
  return (
    <div className="icon-tile" style={{ width: size, height: size }}>
      <CategoryIcon name={label} size={iconSize || Math.round(size * 0.47)} />
    </div>
  );
}