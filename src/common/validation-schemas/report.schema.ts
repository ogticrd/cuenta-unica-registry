import { z } from 'zod';

import { Context } from '@/app/[lang]/provider';

export const createReportSchema = ({ validations }: Context['intl']) =>
  z.object({
    cedula: z.string().min(13, validations.required),
    email: z.email(validations.email.invalid),
    name: z.string().optional(),
    comments: z.string().min(4, validations.required),
  });
