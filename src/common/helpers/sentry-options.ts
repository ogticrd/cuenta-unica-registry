import type { DataCollection } from '@sentry/core';

// Sentry 11 collects more by default. Retain the v10 automatic collection
// policy; explicitly submitted feedback still carries its form values.
const deniedRequestFields = ['forwarded', '-ip', 'remote-', 'via', '-user'];

export const sentryDataCollection: DataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { deny: deniedRequestFields },
    response: { deny: deniedRequestFields },
  },
  httpBodies: [],
  urlQueryParams: { deny: deniedRequestFields },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  graphQL: { document: false, variables: false },
  queues: false,
  frameContextLines: 7,
};

export const sentryTunnelPath = '/api/monitoring';
