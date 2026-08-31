export function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

export function isEmailIdentifier(value: string) {
  return value.includes("@");
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidUsername(value: string) {
  return /^[\p{L}\p{N}._-]{3,40}$/u.test(value);
}
