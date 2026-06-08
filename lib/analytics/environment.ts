export const ANALYTICS_ENVIRONMENTS = [
  "production",
  "staging",
  "dev",
] as const;

export type AnalyticsEnvironment = (typeof ANALYTICS_ENVIRONMENTS)[number];

function normalizeAnalyticsEnvironment(value: string): AnalyticsEnvironment {
  const environment = value.trim();

  if ((ANALYTICS_ENVIRONMENTS as readonly string[]).includes(environment)) {
    return environment as AnalyticsEnvironment;
  }

  throw new Error(`Unsupported ANALYTICS_ENVIRONMENT: ${environment}`);
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

export function resolveAnalyticsEnvironment(value?: string) {
  if (value?.trim()) {
    return normalizeAnalyticsEnvironment(value);
  }

  if (process.env.ANALYTICS_ENVIRONMENT?.trim()) {
    return normalizeAnalyticsEnvironment(process.env.ANALYTICS_ENVIRONMENT);
  }

  if (!isProductionRuntime()) {
    return "dev";
  }

  throw new Error("ANALYTICS_ENVIRONMENT is required in production");
}

export function resolveAnalyticsProjectId(value?: string) {
  const projectId =
    value?.trim() ||
    process.env.ANALYTICS_PROJECT_ID?.trim() ||
    process.env.ORY_PROJECT_ID?.trim();

  if (projectId) {
    return projectId;
  }

  if (!isProductionRuntime()) {
    return "registry";
  }

  throw new Error("ANALYTICS_PROJECT_ID or ORY_PROJECT_ID is required");
}
