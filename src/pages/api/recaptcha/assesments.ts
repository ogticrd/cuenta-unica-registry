import { ReCaptchaResponse } from '../types';
import axios, { AxiosResponse } from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next/types';

type ReCaptchaEvent = {
  event: {
    token: string;
    siteKey: string;
    expectedAction: string;
  };
};

const verifyRecaptcha = async (
  recaptchaEvent: ReCaptchaEvent
): Promise<ReCaptchaResponse> => {
  const apiKey = process.env.RECAPTHA_API_KEY;
  const projectId = process.env.RECAPTHA_PROJECT_ID;

  const assesmentUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;
  const response: AxiosResponse<ReCaptchaResponse> = await axios.post(
    assesmentUrl,
    recaptchaEvent
  );

  return response.data;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any | void>
) {
  if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
    throw new Error(
      'NEXT_PUBLIC_RECAPTCHA_SITE_KEY not found in environment variables'
    );
  }

  try {
    const recaptchaEvent: ReCaptchaEvent = {
      event: {
        token: req.body.token,
        siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
        expectedAction: 'form_submit',
      },
    };

    // Recaptcha response
    const response = (await verifyRecaptcha(
      recaptchaEvent
    )) as ReCaptchaResponse;

    // Checking if the reponse sent by reCaptcha success or not and if the score is above 0.5
    // In ReCaptcha v3, a score sent which tells if the data sent from front end is from Human or from Bots. If score above 0.5 then it is human otherwise it is bot
    // For more info check, https://developers.google.com/recaptcha/docs/v3
    // ReCaptcha v3 response, {
    //     "success": true|false,      // whether this request was a valid reCAPTCHA token for your site
    //     "score": number             // the score for this request (0.0 - 1.0)
    //     "action": string            // the action name for this request (important to verify)
    //     "challenge_ts": timestamp,  // timestamp of the challenge load (ISO format yyyy-MM-dd'T'HH:mm:ssZZ)
    //     "hostname": string,         // the hostname of the site where the reCAPTCHA was solved
    //     "error-codes": [...]        // optional
    //   }
    if (response.riskAnalysis && response.riskAnalysis.score >= 0.5) {
      return res.status(200).json({
        isHuman: true,
        status: 'Success',
        message: 'Thank you human',
      });
    } else {
      return res.status(200).json({
        isHuman: false,
        status: 'Failure',
        message: 'Google ReCaptcha Failure',
      });
    }
  } catch (error) {
    console.log('Google ReCaptcha crashed', error);
    res.status(500).json({
      status: 'Failure',
      message: 'Something went wrong, please try again.',
    });
  }
}
