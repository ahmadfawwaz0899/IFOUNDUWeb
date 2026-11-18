/** Digits, spaces, dashes and an optional leading +, 7–20 characters. */
export function isValidPhone(phone: string) {
  return /^[+\d][\d\s-]{6,19}$/.test(phone);
}

export const PHONE_ERROR = "Phone number looks wrong. Use digits, spaces, + or -, e.g. 012-345 6789.";
