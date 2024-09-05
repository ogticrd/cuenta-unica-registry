import { passwordStrength } from 'check-password-strength';
import { z } from 'zod';

import { Context } from '@/app/[lang]/provider';

export const createRegisterSchema = (
  { validations }: Context['intl'],
  cedula: string,
) =>
  z
    .object({
      email: z.string().email(validations.email.invalid),
      emailConfirm: z.string().email(validations.email.invalid),
      password: z.string().min(10, validations.password.minimum),
      passwordConfirm: z.string().min(10, validations.password.minimum),
    })
    .refine(
      (data) => {
        const [email] = data.email.split('@');
        return (
          !data.password.includes(cedula) &&
          !data.password.toLowerCase().includes(email.toLowerCase())
        );
      },
      {
        message: validations.password.similarity,
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
    .refine(({ password }) => !(passwordStrength(password).id !== 3), {
      message: 'Weak password',
      path: ['password'],
    });
