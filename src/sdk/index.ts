import { Configuration, FrontendApi } from '@ory/client';
import { edgeConfig } from '@ory/integrations/next';

export const orySdk = new FrontendApi(new Configuration(edgeConfig));
