import * as Sentry from '@sentry/nextjs';
import type { Metric } from '@sentry/core';

const OPERATIONS = [
  'cedula.validation',
  'biometric.session',
  'biometric.verify',
  'recaptcha',
] as const;
const OUTCOMES = ['success', 'rejected', 'limited', 'error'] as const;
type Operation = (typeof OPERATIONS)[number];
type Outcome = (typeof OUTCOMES)[number];

// Keep metric dimensions bounded. Never attach request data, IDs, provider
// messages, or biometric scores, including user data added by the SDK.
export function filterRegistryMetric(metric: Metric): Metric | null {
  if (
    !['registry.operation', 'registry.operation.duration'].includes(metric.name)
  )
    return null;
  const { operation, outcome } = metric.attributes ?? {};
  if (
    !OPERATIONS.includes(operation as Operation) ||
    !OUTCOMES.includes(outcome as Outcome)
  )
    return null;
  const attributes: Metric['attributes'] = { operation, outcome };
  for (const key of [
    'sentry.release',
    'sentry.environment',
    'sentry.sdk.name',
    'sentry.sdk.version',
  ]) {
    if (metric.attributes?.[key] !== undefined)
      attributes[key] = metric.attributes[key];
  }
  return { ...metric, attributes };
}

export function responseOutcome(response: { status: number }): Outcome {
  if (response.status === 429) return 'limited';
  if (response.status >= 500) return 'error';
  if (response.status >= 400) return 'rejected';
  return 'success';
}

// One counter and one duration per completed server operation, independent of
// trace sampling. The SDK buffers delivery; no flush or network wait here.
export async function measureRegistryOperation<T>(
  operation: Operation,
  run: () => Promise<T>,
  classify: (result: T) => Outcome,
): Promise<T> {
  const start = performance.now();
  let outcome: Outcome = 'error';
  try {
    Sentry.addBreadcrumb({
      category: 'registry.operation',
      message: 'operation_started',
      level: 'info',
      data: { operation },
    });
  } catch {
    /* Telemetry must not affect the operation. */
  }
  try {
    const result = await run();
    try {
      outcome = classify(result);
    } catch {
      /* A classifier failure must not replace the business result. */
    }
    return result;
  } finally {
    const duration = Math.max(0, performance.now() - start);
    const attributes = { operation, outcome };
    try {
      Sentry.metrics.count('registry.operation', 1, { attributes });
      Sentry.metrics.distribution('registry.operation.duration', duration, {
        unit: 'millisecond',
        attributes,
      });
      Sentry.addBreadcrumb({
        category: 'registry.operation',
        message: 'operation_completed',
        level: 'info',
        data: { ...attributes, durationMs: Math.round(duration) },
      });
    } catch {
      /* Telemetry must not replace a result or an application error. */
    }
  }
}
