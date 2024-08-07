'use server';

import { redirect } from 'next/navigation';

import {
  findCitizen,
  findIamCitizen,
  setCookie,
  validateRecaptcha,
} from '@/actions';

type State = { message: string };

export async function identifyAccount(prev: State, form: FormData) {
  const cedula = form.get('cedula') as string;
  const token = form.get('token') as string;

  if (!token) {
    return { message: 'intl.errors.recaptcha.issues' };
  }

  const { isHuman } = await validateRecaptcha(token);

  if (!isHuman) {
    return { message: 'intl.errors.recaptcha.validation' };
  }

  const { exists } = await findIamCitizen(cedula);

  if (exists) {
    return { message: 'intl.errors.cedula.exists' };
  }

  const citizen = await findCitizen(cedula).catch(() => null);

  if (!citizen) {
    return { message: 'intl.errors.cedula.invalid' };
  }

  await setCookie('citizen', citizen);

  redirect('liveness');
}
