import { logger } from "@/lib/logging/logger";
import "server-only";

const DEFAULT_RECAPTCHA_SCORE_THRESHOLD = 0.3;
const DEFAULT_RECAPTCHA_ACTION = "form_submit";

interface RecaptchaAssessment {
  tokenProperties?: {
    valid?: boolean;
    action?: string;
  };
  riskAnalysis?: {
    score?: number;
  };
}

function getRecaptchaConfiguration() {
  return {
    projectId:
      process.env.RECAPTCHA_PROJECT_ID ?? process.env.RECAPTHA_PROJECT_ID,
    apiKey: process.env.RECAPTCHA_API_KEY ?? process.env.RECAPTHA_API_KEY,
    siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
  };
}

function getRecaptchaScoreThreshold() {
  const configuredThreshold = Number(process.env.RECAPTCHA_SCORE_THRESHOLD);

  return Number.isFinite(configuredThreshold) &&
    configuredThreshold >= 0 &&
    configuredThreshold <= 1
    ? configuredThreshold
    : DEFAULT_RECAPTCHA_SCORE_THRESHOLD;
}

export async function validateRecaptchaToken(
  token: string | undefined,
  expectedAction = DEFAULT_RECAPTCHA_ACTION,
): Promise<boolean> {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.RECAPTCHA_BYPASS_LOCAL === "true"
  ) {
    return true;
  }

  if (!token) {
    return false;
  }

  const { projectId, apiKey, siteKey } = getRecaptchaConfiguration();

  if (!projectId || !apiKey || !siteKey) {
    logger.error("Falta configuración de reCAPTCHA", {
      operation: "recaptcha.assessment",
      stage: "configuration",
      code: "recaptcha_failed",
    });
    return false;
  }

  try {
    const assessmentUrl = new URL(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments`,
    );
    assessmentUrl.searchParams.set("key", apiKey);

    const response = await fetch(assessmentUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: {
          token,
          siteKey,
          expectedAction,
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      logger.error(
        `[recaptcha] Assessment failed with status ${response.status}`,
        {
          operation: "recaptcha.recaptcha.service",
          upstreamStatus: response.status,
        },
      );
      return false;
    }

    const assessment = (await response.json()) as RecaptchaAssessment;
    const tokenIsValid = assessment.tokenProperties?.valid !== false;
    const actionMatches =
      !assessment.tokenProperties?.action ||
      assessment.tokenProperties.action === expectedAction;
    const score = Number(assessment.riskAnalysis?.score);

    return (
      tokenIsValid &&
      actionMatches &&
      Number.isFinite(score) &&
      score >= getRecaptchaScoreThreshold()
    );
  } catch (error) {
    logger.error(
      "[recaptcha] Assessment request failed:",
      { operation: "recaptcha.recaptcha.service" },
      error,
    );
    return false;
  }
}
