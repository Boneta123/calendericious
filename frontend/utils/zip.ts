/**
 * US ZIP code validation. USA-only app: we accept a 5-digit ZIP whose
 * numeric value falls inside the real assigned US range (00501–99950).
 * ZIP+4 is intentionally not accepted here — the sign-up field asks for 5.
 */

const MIN_US_ZIP = 501; // 00501, Holtsville NY — lowest assigned ZIP
const MAX_US_ZIP = 99950; // 99950, Ketchikan AK — highest assigned ZIP

/** True when `zip` is exactly 5 digits within the assigned US ZIP range. */
export function isValidUsZip(zip: string): boolean {
  if (!/^\d{5}$/.test(zip)) return false;
  const n = Number(zip);
  return n >= MIN_US_ZIP && n <= MAX_US_ZIP;
}

/** Strip to digits and cap at 5 — for use as an onChangeText sanitizer. */
export function sanitizeZipInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 5);
}
