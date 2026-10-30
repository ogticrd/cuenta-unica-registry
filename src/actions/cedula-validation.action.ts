'use server';

import type { CedulaValidationResponse } from '@/types';
import { unwrap } from '@/common/helpers/unwrap';
import { validLuhn } from '@/common/helpers/validations';

const VALIDATION_TIMEOUT_MS = 5_000;

/**
 * Validates a cedula using Luhn, the configured hash exceptions, and the
 * Citizens validation API as the final fallback.
 */
export async function validateCedula(cedula: string): Promise<boolean> {
  const normalizedCedula = cedula.replace(/-/g, '');

  if (!/^\d{11}$/.test(normalizedCedula)) {
    return false;
  }

  if (await validLuhn(normalizedCedula)) {
    return true;
  }

  const validationApi = process.env.CEDULA_VALIDATION_API;

  if (!validationApi) {
    return false;
  }

  const validationUrl = new URL(
    `${validationApi.replace(/\/$/, '')}/${normalizedCedula}/validate`,
  );

  try {
    const response = await fetch(validationUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(VALIDATION_TIMEOUT_MS),
    }).then<CedulaValidationResponse>(unwrap);

    return response.valid === true;
  } catch {
    return false;
  }
}
