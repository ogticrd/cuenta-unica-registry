'use server';

import { redirect } from 'next/navigation';

import {
  findCitizen,
  findIamCitizenForRecovery,
  setCookie,
  setRecoverySession,
  validateRecaptcha,
} from '@/actions';
import { State } from '@/types';

export async function startAccountRecovery(
  prev: State = { message: '' },
  form: FormData,
): Promise<State> {
  const cedula = form.get('cedula') as string;
  const token = form.get('token') as string;

  if (!token) {
    return { message: 'errors.recaptcha.issues' };
  }

  const { isHuman } = await validateRecaptcha(token);

  if (!isHuman) {
    return { message: 'errors.recaptcha.validation' };
  }

  // For recovery, we need to verify the account EXISTS (opposite of registration)
  const { exists } = await findIamCitizenForRecovery(cedula);

  if (!exists) {
    return { message: 'errors.recovery.notFound' };
  }

  // Validate cedula with JCE to get citizen data
  const citizen = await findCitizen(cedula).catch(() => null);

  if (!citizen) {
    return { message: 'errors.cedula.invalid' };
  }

  // Set citizen cookie for the flow
  await setCookie('citizen', citizen);

  // Set recovery session to indicate we're in recovery mode
  await setRecoverySession(cedula);

  redirect('../liveness');
}
