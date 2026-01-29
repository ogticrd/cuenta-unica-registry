/**
 * Computes SHA-256 hash using Web Crypto API (works in browser and Node.js).
 */
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates cedula using Luhn algorithm.
 */
function checkLuhn(cedula: string): boolean {
  const arr = (cedula + '')
    .split('')
    .reverse()
    .map((x) => parseInt(x));

  const lastDigit = arr.splice(0, 1)[0];

  let sum = arr.reduce(
    (acc, val, i) =>
      i % 2 !== 0 ? acc + val : acc + (val * 2 > 9 ? val * 2 - 9 : val * 2),
    0,
  );

  sum += lastDigit;

  return sum % 10 === 0;
}

/**
 * Checks if a cedula is in the exception list (bypasses Luhn validation).
 * Uses SHA-256 hashes to avoid exposing cedulas in config.
 */
async function isLuhnException(cedula: string): Promise<boolean> {
  const exceptionHashes = process.env.NEXT_PUBLIC_LUHN_EXCEPTION_HASHES;
  if (!exceptionHashes) {
    return false;
  }

  const hashList = exceptionHashes
    .split(',')
    .map((h) => h.trim().toLowerCase());
  const cedulaHash = await sha256(cedula);

  return hashList.includes(cedulaHash);
}

/**
 * Validates cedula using Luhn algorithm with exception support.
 * Some valid cedulas fail Luhn checksum - these are whitelisted via hashes.
 */
export async function validLuhn(cedula: string): Promise<boolean> {
  if (checkLuhn(cedula)) {
    return true;
  }
  return isLuhnException(cedula);
}
