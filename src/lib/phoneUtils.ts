/** Strip non-phone characters and normalize spacing. */
export const cleanPhoneInput = (value: string): string =>
  value.replace(/[^0-9+\-\s()]/g, "");

/** Digits only (for validation). */
export const phoneDigits = (value: string): string =>
  value.replace(/[^0-9]/g, "");

/** Cambodian mobile: at least 8 digits (0xx… or 855…). */
export const isValidPhone = (value: string): boolean => {
  const digits = phoneDigits(value);
  if (digits.length < 8) return false;
  if (digits.startsWith("855")) return digits.length >= 11;
  return digits.length >= 8 && digits.length <= 11;
};

/** Format as 0xx xxx xxxx while typing (Cambodia-style). */
export const formatPhoneDisplay = (value: string): string => {
  const digits = phoneDigits(value);
  if (!digits) return "";

  if (digits.startsWith("855")) {
    const rest = digits.slice(3);
    if (rest.length <= 2) return `+855 ${rest}`;
    if (rest.length <= 5) return `+855 ${rest.slice(0, 2)} ${rest.slice(2)}`;
    return `+855 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 9)}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
};

export const DEFAULT_SHOP_PHONE = "016 600 090";
