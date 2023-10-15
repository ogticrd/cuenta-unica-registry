'use server';

import type { ReCaptchaResponse, ReCaptchaEvent } from '../types';

import logger from '@/common/lib/logger';

const intl = {
  error: {
    server: 'Something went wrong, please try again',
    reCaptcha: 'Google ReCaptcha crashed',
    noEnv: 'variable invalid or undefined',
  },
};

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
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    throw new Error(`NEXT_PUBLIC_RECAPTCHA_SITE_KEY: ${intl.error.noEnv}`);
  }

  try {
    const { riskAnalysis } = await verifyRecaptcha({
      event: {
        token,
        siteKey,
        expectedAction: 'form_submit',
      },
    });

    const isHuman = riskAnalysis && riskAnalysis.score >= 0.3;

    return { isHuman };
  } catch (error) {
    logger.error(intl.error.reCaptcha, error);

    return {
      error: intl.error.server,
    };
  }
}
