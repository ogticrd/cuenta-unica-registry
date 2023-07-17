import * as yup from 'yup';

import { labels } from '@/constants/labels';

export const cedulaSchema = yup.object({
  cedula: yup
    .string()
    .trim()
    .required(labels.form.requiredField)
    .min(11, 'La cédula debe contener al menos 11 dígitos')
    .max(11, 'La ceedula debe contener máximo 11 dígitos'),
});
