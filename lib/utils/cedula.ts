export const CEDULA_DIGITS_LENGTH = 11;
export const CEDULA_MASK_LENGTH = 13;

export function normalizeCedula(value: string) {
  return value.replace(/\D/g, "").slice(0, CEDULA_DIGITS_LENGTH);
}

export function formatCedula(value: string) {
  const digits = normalizeCedula(value);

  if (!digits) {
    return "";
  }

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
}

function checkLuhn(cedula: string) {
  const digits = normalizeCedula(cedula);

  if (digits.length !== CEDULA_DIGITS_LENGTH) {
    return false;
  }

  const reversedDigits = digits
    .split("")
    .reverse()
    .map((digit) => Number.parseInt(digit, 10));

  const checkDigit = reversedDigits.shift();

  if (checkDigit === undefined) {
    return false;
  }

  const sum = reversedDigits.reduce((accumulator, digit, index) => {
    if (index % 2 !== 0) {
      return accumulator + digit;
    }

    const doubledDigit = digit * 2;
    return accumulator + (doubledDigit > 9 ? doubledDigit - 9 : doubledDigit);
  }, checkDigit);

  return sum % 10 === 0;
}

async function sha256(value: string) {
  const encodedValue = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encodedValue);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function isLuhnException(cedula: string) {
  const hashes = process.env.NEXT_PUBLIC_LUHN_EXCEPTION_HASHES;

  if (!hashes) {
    return false;
  }

  const hashList = hashes.split(",").map((hash) => hash.trim().toLowerCase());
  const cedulaHash = await sha256(normalizeCedula(cedula));

  return hashList.includes(cedulaHash);
}

export async function isValidCedula(cedula: string) {
  const normalizedCedula = normalizeCedula(cedula);

  if (normalizedCedula.length !== CEDULA_DIGITS_LENGTH) {
    return false;
  }

  if (hasAllRepeatedDigits(normalizedCedula)) {
    return false;
  }

  if (checkLuhn(normalizedCedula)) {
    return true;
  }

  return isLuhnException(normalizedCedula);
}

function hasAllRepeatedDigits(value: string) {
  const firstDigit = value[0];
  return value.split("").every((digit) => digit === firstDigit);
}
