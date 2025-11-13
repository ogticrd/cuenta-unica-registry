import 'server-only';

import z from 'zod';

import { validLuhn } from '@/common/helpers';
import { Context } from '../provider';

export const createInputSchema = ({ validations, errors }: Context['intl']) =>
  z
    .object({
      cedula: z
        .string()
        .length(11, validations.cedula.min)
        .refine(validLuhn, { message: errors.cedula.invalid }),
      redirect_uri: z.url(),
      client_id: z.uuid(),
    })
    .transform(async (data) => {
      const { findCitizen } = await import('@/actions');
      const { getOAuth2Client } = await import('@/common/lib/oauth');

      // Fetch citizen data
      const citizen = await findCitizen(data.cedula);

      // Fetch OAuth2 client
      const client = await getOAuth2Client(data.client_id);
      if (!client) {
        throw new Error('Invalid OAuth2 client');
      }

      // Validate redirect_uri against client's allowed URIs
      if (!client.redirect_uris?.includes(data.redirect_uri)) {
        throw new Error('Invalid redirect_uri');
      }

      return {
        citizen,
        redirectUri: data.redirect_uri,
      };
    });
