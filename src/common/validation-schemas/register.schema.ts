import { z } from 'zod';

export const RegisterValidationSchema = z.object({
  email: z.string().email(),
  emailConfirm: z.string().email(),
  password: z.string().min(8),
  passwordConfirm: z.string().min(8),
});
