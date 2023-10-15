module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'deps',
        'chore',
        'style',
        'refactor',
        'ci',
        'test',
        'revert',
        'perf',
        'vercel',
      ],
    ],
  },
};
