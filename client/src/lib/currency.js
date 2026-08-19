// Single source of truth for currency symbols/formatting — replaces the
// hardcoded "Rs" literal that was previously typed directly into ~8 screen
// files. All money display should go through formatMoney() so switching
// currency in Settings actually propagates everywhere.

const CURRENCY_SYMBOLS = {
  PKR: 'Rs',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'AED',
  SAR: 'SAR',
  INR: '₹',
};

export function getCurrencySymbol(code) {
  return CURRENCY_SYMBOLS[code] || 'Rs';
}

// Usage: formatMoney(1500, user?.currencyPreference) -> "Rs 1,500" or "$1,500"
export function formatMoney(amount, currencyCode) {
  const symbol = getCurrencySymbol(currencyCode);
  const num = Number(amount || 0).toLocaleString();
  // PKR/INR conventionally show symbol with a space ("Rs 1,500"), most
  // others don't ("$1,500") — matches common regional formatting.
  const spaced = symbol.length > 1;
  return spaced ? `${symbol} ${num}` : `${symbol}${num}`;
}