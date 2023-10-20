import { z } from 'zod';

import { Context } from '@/app/[lang]/provider';

export const createCedulaSchema = ({ intl: { validations } }: Context) =>
  z.object({
    cedula: z
      .string()
      .min(11, validations.cedula.min)
      .max(11, validations.cedula.max),
  });
