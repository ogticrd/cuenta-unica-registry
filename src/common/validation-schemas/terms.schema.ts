import { z } from 'zod';

import { Context } from '@/app/[lang]/provider';

export const createTermsSchema = (intl: Context['intl']) =>
  z.object({
    accepted: z.literal(true, {
      required_error: intl.terms.check,
    }),
  });
