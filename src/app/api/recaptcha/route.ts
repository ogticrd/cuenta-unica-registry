import type { ReCaptchaResponse, ReCaptchaEvent } from '../types';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import logger from '@/lib/logger';

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

export async function POST(req: NextRequest) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    throw new Error(
      'NEXT_PUBLIC_RECAPTCHA_SITE_KEY not found in environment variables',
    );
  }

  try {
    const { token }: { token: string } = await req.json();

    // For more info check, https://developers.google.com/recaptcha/docs/v3
    const { riskAnalysis } = await verifyRecaptcha({
      event: {
        token,
        siteKey,
        expectedAction: 'form_submit',
      },
    });

    const isHuman = riskAnalysis && riskAnalysis.score >= 0.3;

    return NextResponse.json({ isHuman });
  } catch (error) {
    logger.error('Google ReCaptcha crashed', error);

    return NextResponse.json(
      {
        error: 'Something went wrong, please try again.',
      },
      { status: 500 },
    );
  }
}
