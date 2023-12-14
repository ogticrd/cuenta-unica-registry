import { z } from 'zod';

import { Context } from '@/app/[lang]/provider';

export const createRegisterSchema = (
  { intl: { validations } }: Context,
  cedula: string,
) =>
  z
    .object({
      email: z.string().email(validations.email.invalid),
      emailConfirm: z.string().email(validations.email.invalid),
      password: z.string().min(8),
      passwordConfirm: z.string().min(8),
    })
    .refine(({ password }) => !password.includes(cedula), {
      message: validations.password.hasID,
      path: ['password'],
    })
    .refine(({ passwordConfirm }) => !passwordConfirm.includes(cedula), {
      message: validations.password.hasID,
      path: ['passwordConfirm'],
    })
    .refine((data) => data.email === data.emailConfirm, {
      message: validations.email.noMatch,
      path: ['emailConfirm'],
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: validations.password.noMatch,
      path: ['passwordConfirm'],
    });
