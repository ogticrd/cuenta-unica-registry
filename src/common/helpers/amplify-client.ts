'use client';

import { Amplify } from 'aws-amplify';

import config from '@/amplifyconfiguration.json';

let isAmplifyClientConfigured = false;

export function configureAmplifyClient(): void {
  if (isAmplifyClientConfigured || typeof window === 'undefined') {
    return;
  }

  Amplify.configure(config, { ssr: true });
  isAmplifyClientConfigured = true;
}
