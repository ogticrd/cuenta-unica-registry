'use server';

import { redirect } from 'next/navigation';

import {
  findCitizen,
  findIamCitizen,
  setCookie,
  validateRecaptcha,
} from '@/actions';
import { State } from '@/types';

export async function identifyAccount(
  prev: State,
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

  const { exists } = await findIamCitizen(cedula);

  if (exists) {
    return redirect(`../redirection?cedula=${cedula}`);
  }

  const citizen = await findCitizen(cedula).catch(() => null);

  if (!citizen) {
    return { message: 'errors.cedula.invalid' };
  }

  await setCookie('citizen', citizen);

  redirect('../liveness');
}
