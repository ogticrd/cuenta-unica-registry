import { z } from 'zod';

import { Context } from '@/app/[lang]/provider';

export const createCedulaSchema = ({ validations }: Context['intl']) =>
  z.object({
    cedula: z
      .string()
      .min(11, validations.cedula.min)
      .max(11, validations.cedula.max),
  });
