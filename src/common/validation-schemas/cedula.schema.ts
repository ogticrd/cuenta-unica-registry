import { z } from 'zod';

import { Context } from '@/app/[lang]/provider';
import { validLuhn } from '../helpers';

export const createCedulaSchema = ({ validations, errors }: Context['intl']) =>
  z.object({
    cedula: z
      .string()
      .min(11, validations.cedula.min)
      .max(11, validations.cedula.max)
      .refine(validLuhn, { message: errors.cedula.invalid }),
    token: z.string(),
  });
