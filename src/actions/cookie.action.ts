'use server';

import { cookies } from 'next/headers';

const RECOVERY_SESSION_KEY = 'recovery_session';
const RECOVERY_SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export type RecoverySession = {
  cedula: string;
  initiatedAt: number;
  expiresAt: number;
};

export async function setCookie<T>(key: string, data: T) {
  const payload = JSON.stringify(data);

  (await cookies()).set(key, btoa(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 10,
    sameSite: 'strict',
    path: '/',
  });
}

export async function getCookie<T>(key: string) {
  let data = (await cookies()).get(key)?.value;

  try {
    return JSON.parse(atob(data as string)) as T;
  } catch (err) {
    return null;
  }
}

export async function removeCookie(key: string) {
  (await cookies()).delete(key);
}

/**
 * Creates a recovery session for account recovery flow.
 * The session expires after 30 minutes.
 */
export async function setRecoverySession(cedula: string): Promise<void> {
  const now = Date.now();
  const session: RecoverySession = {
    cedula,
    initiatedAt: now,
    expiresAt: now + RECOVERY_SESSION_DURATION_MS,
  };
  await setCookie(RECOVERY_SESSION_KEY, session);
}

/**
 * Gets the current recovery session if valid and not expired.
 * Returns null if no session exists or if it has expired.
 */
export async function getRecoverySession(): Promise<RecoverySession | null> {
  const session = await getCookie<RecoverySession>(RECOVERY_SESSION_KEY);

  if (!session) {
    return null;
  }

  // Check if session has expired
  if (session.expiresAt < Date.now()) {
    await clearRecoverySession();
    return null;
  }

  return session;
}

/**
 * Checks if there's an active recovery session.
 */
export async function isRecoveryMode(): Promise<boolean> {
  const session = await getRecoverySession();
  return session !== null;
}

/**
 * Clears the recovery session.
 */
export async function clearRecoverySession(): Promise<void> {
  await removeCookie(RECOVERY_SESSION_KEY);
}
