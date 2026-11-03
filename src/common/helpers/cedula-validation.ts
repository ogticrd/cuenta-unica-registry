import 'server-only';

import type { CedulaValidationResponse } from '@/types';
import { unwrap } from './unwrap';
import { validLuhn } from './validations';
import { hasCedulaValidationReceipt } from './cedula-validation-receipt';
import { recordCedulaValidationFailure } from './sentry-telemetry';

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
    recordCedulaValidationFailure('missing_api');
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

    recordCedulaValidationFailure('invalid_response');
    return 'unavailable';
  } catch (error) {
    recordCedulaValidationFailure('request_failed', error);
    return 'unavailable';
  }
}
