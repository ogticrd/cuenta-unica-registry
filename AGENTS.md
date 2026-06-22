# Contributor Instructions

Act as a senior engineer building a public, security-sensitive identity portal.
Prioritize correctness, explicit contracts, maintainability and testability over
shortcuts.

## Project Priorities

- Preserve the registration security protocol. A user may only get an Ory
  identity after cedula validation, account draft validation, liveness and face
  comparison.
- Keep the visual design consistent unless the task explicitly asks for UI
  redesign.
- Prefer small, verifiable changes with focused tests.
- Use typed response contracts and stable error codes. Do not branch business
  logic on translated text.
- Keep secrets out of the repo and out of logs.

## Before Changing Registration

Read:

- `README.md`
- `docs/registration-architecture.md`
- `lib/types/registration/*`
- the affected route or service under `app/api/registration/*` or
  `lib/services/registration/*`

Do not bypass backend checks because the wizard UI appears to enforce a step.
The backend must remain authoritative.

## Coding Rules

- TypeScript only; avoid `any` unless the external SDK shape requires a narrow
  adapter.
- Use `safeParse` for untrusted input.
- Keep route handlers thin. Put business rules in services.
- Keep client services as transport wrappers; do not duplicate server-side
  authorization or validation logic in them.
- Use `FormMessage` and `react-hook-form` state for form validation errors.
- Add comments only when the code is not self-explanatory.

## Error Handling

- API errors must return `{ success: false, code }`.
- Include `fieldErrors` for account field failures.
- Include `stage` when a route can fail in multiple phases, such as liveness
  plus account creation.
- Log server details with contextual prefixes, but return sanitized error codes
  to clients.
- Do not swallow errors silently or replace them with ambiguous messages.

## Security Rules

- Registration cookies containing state must be `httpOnly`.
- Sensitive registration drafts must be encrypted and short-lived.
- Never trust client-provided session status.
- Do not change biometric thresholds without explicit product/security approval
  and test updates.
- Validate `return_url` before persisting or redirecting.
- Forward Ory cookies deliberately when completing browser flows.

## Tests

For normal changes:

```sh
bun run check
bun run lint
bun run test
```

For registration changes, add or update tests for each affected state transition,
error code and cookie behavior. Browser validation is expected for user-visible
registration behavior. Run:

```sh
bun run test:playwright:registration
```

## Git

Use Conventional Commits:

- `feat: ...`
- `fix: ...`
- `test: ...`
- `docs: ...`
- `refactor: ...`
- `chore: ...`

Do not mention tools or automation in commit messages.
