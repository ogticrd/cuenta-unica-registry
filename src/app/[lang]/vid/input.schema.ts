import 'server-only';

import z from 'zod';

import { validLuhn } from '@/common/helpers/validations';
import { Context } from '../provider';

export const createInputSchema = ({ errors }: Context['intl']) =>
  z
    .object({
      access_token: z.string(),
      redirect_uri: z.url(),
      client_id: z.uuid(),
      state: z.string().optional(),
    })
    .transform(async (data) => {
      const { findCitizen, findIdentityById } = await import('@/actions');
      const { getOAuth2Client, introspectAccessToken, getUserInfoFromToken } =
        await import('@/common/lib/oauth');

      // Validate access token via introspection or userinfo fallback
      const token = await introspectAccessToken(data.access_token);
      const userinfo = token?.active
        ? null
        : await getUserInfoFromToken(data.access_token);

      const userinfoError = userinfo && 'error' in userinfo;

      if (!token?.active && (!userinfo || userinfoError)) {
        throw new Error('Invalid access_token');
      }

      if (token?.token_use === 'refresh_token') {
        throw new Error('Invalid access_token');
      }

      // Validate client_id against token audience or client_id claim
      const audience =
        (token?.aud as string | string[] | undefined) ??
        (userinfo?.aud as string | string[] | undefined);

      const audList = Array.isArray(audience)
        ? audience
        : audience
          ? [audience]
          : [];

      if (audList.length > 0) {
        if (!audList.includes(data.client_id)) {
          throw new Error('Invalid OAuth2 client');
        }
      } else if (token?.client_id && token.client_id !== data.client_id) {
        throw new Error('Invalid OAuth2 client');
      }

      // Extract identity from token
      const tokenExt = token?.ext as
        | {
            session?: { identity?: { id?: string; traits?: unknown } };
            id_token_claims?: unknown;
          }
        | undefined;

      const identityId =
        tokenExt?.session?.identity?.id ?? token?.sub ?? userinfo?.sub ?? null;

      const identity = identityId ? await findIdentityById(identityId) : null;

      const traits = (identity?.traits ??
        tokenExt?.session?.identity?.traits ??
        tokenExt?.id_token_claims ??
        (userinfo as unknown)) as
        | { cedula?: string; username?: string; preferred_username?: string }
        | undefined;

      // Extract and validate cedula
      const normalize = (value?: string) => value?.replace(/\D/g, '') || '';
      const cedula =
        normalize(traits?.cedula) ||
        normalize(traits?.username) ||
        normalize(traits?.preferred_username) ||
        normalize(identityId);

      if (!cedula || cedula.length !== 11 || !validLuhn(cedula)) {
        throw new Error(errors.cedula.invalid);
      }

      // Fetch citizen data from padron
      const citizen = await findCitizen(cedula);

      // Validate OAuth2 client and redirect_uri
      const client = await getOAuth2Client(data.client_id);
      const tokenValidatedClient = token?.client_id === data.client_id;

      if (!client && !tokenValidatedClient) {
        throw new Error('Invalid OAuth2 client');
      }

      if (client && !client.redirect_uris?.includes(data.redirect_uri)) {
        throw new Error('Invalid redirect_uri');
      }

      return {
        citizen,
        redirectUri: data.redirect_uri,
        state: data.state,
      };
    });
