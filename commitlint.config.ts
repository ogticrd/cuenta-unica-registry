import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'bump',
        'chore',
        'style',
        'refactor',
        'ci',
        'test',
        'revert',
        'perf',
        'build',
      ],
    ],
    'header-max-length': [2, 'always', 200],
    'body-max-line-length': [2, 'always', 400],
    'footer-max-line-length': [2, 'always', 90],
  },
};

export default config;
