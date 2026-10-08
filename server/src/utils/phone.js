// WhatsApp numbers are stored as digits only, with country code (E.164 without "+"), e.g. "919876543210".
export const DEFAULT_COUNTRY_CODE = '91'; // used when someone enters a 10-digit local number

// Returns { phone } (possibly '' to clear) or { error }
export function normalizePhone(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return { phone: '' };
  if (!/^[+\d\s\-().]+$/.test(raw)) return { error: 'Phone number can only contain digits, spaces, +, - and brackets' };

  let digits = raw.replace(/\D/g, '');
  if (raw.startsWith('00')) digits = digits.slice(2); // 0091... international prefix
  else if (!raw.startsWith('+') && digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1); // 09876...
  if (!raw.startsWith('+') && digits.length === 10) digits = DEFAULT_COUNTRY_CODE + digits;

  if (digits.length < 11 || digits.length > 15 || digits.startsWith('0')) {
    return { error: 'Enter a valid WhatsApp number with country code, e.g. +91 98765 43210' };
  }
  return { phone: digits };
}
