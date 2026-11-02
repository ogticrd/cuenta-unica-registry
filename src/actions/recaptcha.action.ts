'use server';

import * as Sentry from '@sentry/nextjs';
import { getSafeErrorName } from '@/common/helpers/sentry-telemetry';

import type { ReCaptchaResponse, ReCaptchaEvent } from '../types';

const verifyRecaptcha = async (recaptchaEvent: ReCaptchaEvent) => {
  const projectId = process.env.RECAPTHA_PROJECT_ID;
  const assesment = new URL(
    `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments`,
  );
  assesment.searchParams.append('key', process.env.RECAPTHA_API_KEY!);

  const options: RequestInit = {
    method: 'POST',
    body: JSON.stringify(recaptchaEvent),
  };

  return fetch(assesment, options).then<ReCaptchaResponse>((res) => res.json());
};

export async function validateRecaptcha(token: string) {
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.RECAPTCHA_BYPASS_LOCAL === 'true'
  ) {
    return { isHuman: true };
  }

  const variable = 'NEXT_PUBLIC_RECAPTCHA_SITE_KEY';
  const siteKey = process.env[variable];

  if (!siteKey) {
    throw new Error(`${variable}: undefined env variable`);
  }

  try {
    const { riskAnalysis } = await verifyRecaptcha({
      event: {
        token,
        siteKey,
        expectedAction: 'form_submit',
      },
    });

    const isHuman = Number(riskAnalysis?.score) >= 0.3;

    return { isHuman };
  } catch (error) {
    Sentry.captureMessage('recaptcha_verification_failed', {
      level: 'error',
      tags: { type: 'recaptcha' },
      extra: { errorName: getSafeErrorName(error) },
    });

    return {
      message: 'errors.unknown',
    };
  }
}
