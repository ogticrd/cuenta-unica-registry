import { passwordStrength } from 'check-password-strength';
import { z } from 'zod';

import { Context } from '@/app/[lang]/provider';
import { pwnedPassword } from 'hibp';

export const createRegisterSchema = (
  { validations, warnings }: Context['intl'],
  cedula: string,
) =>
  z
    .object({
      email: z.string().email(validations.email.invalid),
      emailConfirm: z.string().email(validations.email.invalid),
      password: z.string().min(10, validations.password.minimum),
      passwordConfirm: z.string().min(10, validations.password.minimum),
    })
    .refine((data) => !data.password.includes(cedula), {
      message: validations.password.cedulaSimilarity,
      path: ['password'],
    })
    .refine(
      (data) => {
        const [email] = data.email.split('@');

        if (!email) return true;

        return !data.password.toLowerCase().includes(email.toLowerCase());
      },
      {
        message: validations.password.emailSimilarity,
        path: ['password'],
      },
    )
    .refine((data) => data.email === data.emailConfirm, {
      message: validations.email.noMatch,
      path: ['emailConfirm'],
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: validations.password.noMatch,
      path: ['passwordConfirm'],
    })
    .refine(({ password }) => passwordStrength(password).id >= 2, {
      message: validations.password.weak,
      path: ['password'],
    })
    .refine(
      ({ password }) =>
        pwnedPassword(password).then((exposure) => exposure == 0),
      {
        message: warnings.breachedPassword,
        path: ['password'],
      },
    );
