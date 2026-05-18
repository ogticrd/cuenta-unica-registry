const PASSWORD_LOWERCASE_REGEX = /[a-z]/;
const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
const PASSWORD_NUMBER_REGEX = /\d/;
const PASSWORD_SYMBOL_REGEX = /[^A-Za-z0-9]/;

export const PASSWORD_MIN_LENGTH = 10;

export function getPasswordRequirementStatus(password: string) {
  return {
    lowercase: PASSWORD_LOWERCASE_REGEX.test(password),
    uppercase: PASSWORD_UPPERCASE_REGEX.test(password),
    number: PASSWORD_NUMBER_REGEX.test(password),
    symbol: PASSWORD_SYMBOL_REGEX.test(password),
    length: password.length >= PASSWORD_MIN_LENGTH,
  };
}

export function isPasswordStrongEnough(password: string) {
  const requirements = getPasswordRequirementStatus(password);
  return (
    requirements.length &&
    requirements.lowercase &&
    requirements.uppercase &&
    requirements.number &&
    requirements.symbol
  );
}

async function sha1(value: string) {
  const encodedValue = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-1", encodedValue);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

const breachCache = new Map<string, boolean>();

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingResolve: ((value: boolean) => void) | null = null;

export async function isBreachedPassword(password: string): Promise<boolean> {
  if (!password || !isPasswordStrongEnough(password)) {
    return false;
  }

  if (breachCache.has(password)) {
    return breachCache.get(password)!;
  }

  return new Promise((resolve) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    if (pendingResolve) {
      pendingResolve(false);
    }
    
    pendingResolve = resolve;

    debounceTimer = setTimeout(async () => {
      try {
        const hash = await sha1(password);
        const prefix = hash.slice(0, 5);
        const suffix = hash.slice(5);
        const response = await fetch(
          `https://api.pwnedpasswords.com/range/${prefix}`,
          {
            headers: {
              "Add-Padding": "true",
            },
          },
        );

        if (!response.ok) {
          resolve(false);
          return;
        }

        const responseBody = await response.text();

        const isBreached = responseBody
          .split("\n")
          .some((line) => line.split(":")[0]?.trim().toUpperCase() === suffix);

        if (breachCache.size > 50) {
          const firstKey = breachCache.keys().next().value;
          if (firstKey) breachCache.delete(firstKey);
        }

        breachCache.set(password, isBreached);

        resolve(isBreached);
      } catch (error) {
        console.error(
          "[password] Failed to validate password breach status:",
          error,
        );
        resolve(false);
      } finally {
        if (pendingResolve === resolve) {
          pendingResolve = null;
          debounceTimer = null;
        }
      }
    }, 1000);
  });
}
