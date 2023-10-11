import { z } from 'zod';

export const TermsValidationSchema = z.object({
  accepted: z.boolean({
    required_error: 'Debe aceptar los términos y políticas de privacidad.',
  }),
});
