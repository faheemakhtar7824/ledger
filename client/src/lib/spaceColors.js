// 10-color palette auto-assigned to new spaces, cycling in order. Stored
// in the Space.color column (already exists in schema.prisma) so it
// persists per space rather than being recomputed client-side.
export const SPACE_COLOR_PALETTE = [
  '#0B6E4F', // emerald
  '#33359A', // indigo
  '#B08D3F', // gold
  '#D8453A', // red
  '#1D7A8C', // teal
  '#8E44AD', // purple
  '#C0682D', // burnt orange
  '#2D6E8E', // steel blue
  '#7A8C1D', // olive
  '#A83D6E', // magenta
];

export function nextSpaceColor(existingSpaces) {
  const usedColors = new Set(existingSpaces.map((s) => s.color).filter(Boolean));
  const unused = SPACE_COLOR_PALETTE.find((c) => !usedColors.has(c));
  if (unused) return unused;
  // All colors used at least once — cycle by count
  return SPACE_COLOR_PALETTE[existingSpaces.length % SPACE_COLOR_PALETTE.length];
}