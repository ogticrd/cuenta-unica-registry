import { z } from 'zod';

import { Context } from '@/app/[lang]/provider';

export const createConfirmationSchema = ({ validations }: Context['intl']) =>
  z.object({
    email: z.string().email(validations.email.invalid),
  });
