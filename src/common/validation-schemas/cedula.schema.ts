import { z } from 'zod';

import { Context } from '@/app/[lang]/provider';
import { validLuhn } from '@/common/helpers/validations';

export type CedulaExceptionStatus =
  'valid' | 'invalid' | 'unavailable' | 'recaptcha';

export const createCedulaSchema = (
  { validations, errors }: Context['intl'],
  checkException?: (cedula: string) => Promise<CedulaExceptionStatus>,
) =>
  z.object({
    cedula: z
      .string()
      .min(11, validations.cedula.min)
      .max(11, validations.cedula.max)
      .regex(/^\d{11}$/, errors.cedula.invalid)
      .superRefine(async (cedula, ctx) => {
        if (!/^\d{11}$/.test(cedula) || (await validLuhn(cedula))) return;

        const status = checkException
          ? await checkException(cedula)
          : 'invalid';
        if (status !== 'valid') {
          ctx.addIssue({
            code: 'custom',
            message:
              status === 'recaptcha'
                ? errors.recaptcha.issues
                : errors.cedula.invalid,
          });
        }
      }),
    token: z.string(),
  });
