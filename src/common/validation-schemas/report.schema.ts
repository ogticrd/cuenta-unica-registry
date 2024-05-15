import { z } from 'zod';

import { Context } from '@/app/[lang]/provider';

export const createReportSchema = ({ validations }: Context['intl']) =>
  z.object({
    email: z.string().email(validations.email.invalid),
    name: z.string().optional(),
    comments: z.string().min(4, validations.required),
  });
