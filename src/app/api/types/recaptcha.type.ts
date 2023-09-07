export type ReCaptchaResponse = {
  tokenProperties: {
    valid: boolean;
    hostname: string;
    action: string;
    createTime: string;
  };
  riskAnalysis: {
    score: number;
    reasons: string[];
  };
  event: {
    token: string;
    siteKey: string;
    expectedAction: string;
  };
  name: string;
};
