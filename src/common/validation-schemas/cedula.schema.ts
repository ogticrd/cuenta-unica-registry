import { z } from 'zod';

const errorMessage = 'Asegúrese de que la cédula contenga 11 dígitos.';

export const CedulaValidationSchema = z.object({
  cedula: z.string().min(11, errorMessage).max(11, errorMessage),
});
