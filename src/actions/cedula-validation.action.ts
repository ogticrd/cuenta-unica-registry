'use server';

import type { CedulaValidationResponse } from '@/types';
import { unwrap } from '@/common/helpers/unwrap';
import { validLuhn } from '@/common/helpers/validations';
import {
  hasCedulaValidationReceipt,
  issueCedulaValidationReceipt,
} from '@/common/helpers/cedula-validation-receipt';
import { validateRecaptcha } from './recaptcha.action';

const VALIDATION_TIMEOUT_MS = 5_000;

/**
 * Validates a cedula using Luhn, the configured hash exceptions, and the
 * Citizens validation API as the final fallback.
 */
export async function validateCedula(
  cedula: string,
  receipt?: string,
): Promise<'valid' | 'invalid' | 'unavailable'> {
  const normalizedCedula = cedula.replace(/-/g, '');

  if (!/^\d{11}$/.test(normalizedCedula)) {
    return 'invalid';
  }

  if (await validLuhn(normalizedCedula)) {
    return 'valid';
  }

  if (receipt && hasCedulaValidationReceipt(normalizedCedula, receipt)) {
    return 'valid';
  }

  const validationApi = process.env.CEDULA_VALIDATION_API;

  if (!validationApi) {
    return 'unavailable';
  }

  try {
    const validationUrl = new URL(
      `${validationApi.replace(/\/$/, '')}/${normalizedCedula}/validate`,
    );
    const response = await fetch(validationUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(VALIDATION_TIMEOUT_MS),
    }).then<CedulaValidationResponse>(unwrap);

    if (response && typeof response === 'object' && 'valid' in response) {
      if (response.valid === true) return 'valid';
      if (response.valid === false) return 'invalid';
    }

    return 'unavailable';
  } catch {
    return 'unavailable';
  }
}

/** Checks potential exceptions while typing, without creating an account. */
export async function checkCedulaException(cedula: string, token: string) {
  if (!/^\d{11}$/.test(cedula)) return { status: 'invalid' as const };
  if (!process.env.CEDULA_VALIDATION_API || !process.env.SITE_COOKIE_KEY) {
    return { status: 'unavailable' as const };
  }
  if (!token || !(await validateRecaptcha(token)).isHuman) {
    return { status: 'recaptcha' as const };
  }

  const status = await validateCedula(cedula);
  return status === 'valid'
    ? { status, ...issueCedulaValidationReceipt(cedula) }
    : { status };
}
