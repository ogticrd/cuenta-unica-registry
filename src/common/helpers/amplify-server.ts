import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import config from '@/amplifyconfiguration.json';

export const { runWithAmplifyServerContext } = createServerRunner({
  config,
});
