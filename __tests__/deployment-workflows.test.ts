// @vitest-environment node
import { readFileSync } from 'node:fs';
import { data, Evaluator, Lexer, Parser } from '@actions/expressions';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

function workflow(file: string) {
  return parse(
    readFileSync(
      new URL(`../.github/workflows/${file}`, import.meta.url),
      'utf8',
    ),
  );
}

// Evaluate the expressions from the YAML with GitHub's own expression library.
function evaluate(expression: string, github: Record<string, unknown>) {
  const tokens = new Lexer(expression).lex().tokens;
  const ast = new Parser(tokens, ['github'], []).parse();
  const context = JSON.parse(JSON.stringify({ github }), data.reviver);
  return new Evaluator(ast, context).evaluate().coerceString();
}

function prContext(association = 'MEMBER', owner = 'ogticrd', merged = true) {
  return {
    event_name: 'pull_request',
    repository_owner: 'ogticrd',
    actor: 'trusted-maintainer',
    triggering_actor: 'trusted-maintainer',
    workflow: 'Deploy to dev',
    ref: 'refs/pull/100/merge',
    head_ref: 'staging',
    event: {
      pull_request: {
        number: 100,
        author_association: association,
        merged,
        head: { repo: { owner: { login: owner } } },
      },
    },
  };
}

const deploymentJobs = [
  ['cd-deploy-to-dev.yml', 'build'],
  ['cd-deploy-to-dev.yml', 'deploy'],
  ['sub-build-push-image.yml', 'build'],
  ['sub-cloudrun-deploy.yml', 'versioning'],
  ['sub-cloudrun-deploy.yml', 'deploy'],
  ['delete-deployment.yml', 'delete-cloud-run'],
] as const;

describe.each(deploymentJobs)('%s / %s', (file, job) => {
  const condition = workflow(file).jobs[job].if;

  it.each(['MEMBER', 'OWNER'])(
    'allows an org-owned PR by %s',
    (association) => {
      expect(evaluate(condition, prContext(association))).toBe('true');
    },
  );

  it.each([
    'NONE',
    'CONTRIBUTOR',
    'FIRST_TIMER',
    'FIRST_TIME_CONTRIBUTOR',
    'COLLABORATOR',
    '',
  ])(
    'blocks %s even when a maintainer reruns a PR from an org-owned repo',
    (association) => {
      expect(evaluate(condition, prContext(association))).toBe('false');
    },
  );

  it.each(['MEMBER', 'OWNER', 'CONTRIBUTOR'])(
    'blocks a personal fork by %s',
    (association) => {
      expect(evaluate(condition, prContext(association, 'external-user'))).toBe(
        'false',
      );
    },
  );

  it('fails closed when the source repository is missing', () => {
    const github = prContext();
    Reflect.set(github.event.pull_request.head, 'repo', null);
    expect(evaluate(condition, github)).toBe('false');
  });

  it.each(['pull_request_target', 'workflow_run', 'issue_comment'])(
    'does not authorize a new privileged trigger: %s',
    (event_name) => {
      expect(evaluate(condition, { ...prContext(), event_name })).toBe('false');
    },
  );

  it.each(['workflow_dispatch', 'push', 'release'])(
    'preserves the intended %s entry points without PR metadata',
    (event_name) => {
      const allowed =
        file.startsWith('sub-') ||
        (file === 'cd-deploy-to-dev.yml' && event_name === 'workflow_dispatch');
      expect(
        evaluate(condition, {
          event_name,
          repository_owner: 'ogticrd',
          event: {},
        }),
      ).toBe(String(allowed));
    },
  );
});

it('does not clean up an unmerged internal PR', () => {
  const condition = workflow('delete-deployment.yml').jobs['delete-cloud-run']
    .if;
  expect(evaluate(condition, prContext('MEMBER', 'ogticrd', false))).toBe(
    'false',
  );
});

it('isolates PR deployment concurrency even when branch names match', () => {
  const group = workflow('cd-deploy-to-dev.yml').concurrency.group as string;
  const render = (github: Record<string, unknown>) =>
    group.replace(/\$\{\{(.*?)\}\}/g, (_, expression: string) =>
      evaluate(expression, github),
    );
  const internal = prContext();
  const external = prContext('CONTRIBUTOR', 'external-user');
  external.event.pull_request.number = 200;
  expect(render(internal)).not.toBe(render(external));
  expect(render(internal)).toBe(render(prContext()));
});

it.each(['ci-check-linters.yml', 'ci-unit-tests.yml'])(
  '%s keeps unprivileged PR checks available to external authors',
  (file) => {
    const config = workflow(file);
    expect(config.on.pull_request.branches).toContain('master');
    expect(config.on).not.toHaveProperty('pull_request_target');
    expect(config.permissions).toBe('read-all');
    for (const job of Object.values(config.jobs) as Record<string, unknown>[]) {
      expect(job.if).toBeUndefined();
      expect(job.environment).toBeUndefined();
    }
  },
);

it('runs the guard regression tests when any workflow changes', () => {
  const config = workflow('ci-unit-tests.yml');
  expect(config.on.pull_request.paths).toContain('.github/workflows/**');
  expect(config.on.push.paths).toContain('.github/workflows/**');
});
