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

export async function isBreachedPassword(password: string) {
  if (!password || !isPasswordStrongEnough(password)) {
    return false;
  }

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
      return false;
    }

    const responseBody = await response.text();

    return responseBody
      .split("\n")
      .some((line) => line.split(":")[0]?.trim().toUpperCase() === suffix);
  } catch (error) {
    console.error(
      "[password] Failed to validate password breach status:",
      error,
    );
    return false;
  }
}
