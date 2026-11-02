'use server';

import { validateCedula } from '@/common/helpers/cedula-validation';
import { issueCedulaValidationReceipt } from '@/common/helpers/cedula-validation-receipt';
import { validateRecaptcha } from './recaptcha.action';

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
