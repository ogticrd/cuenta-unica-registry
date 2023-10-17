import { Context } from '@/app/[lang]/provider';
import { z } from 'zod';

export const createTermsSchema = ({ intl }: Context) =>
  z.object({
    accepted: z.literal(true, {
      required_error: intl.terms.check,
    }),
  });
