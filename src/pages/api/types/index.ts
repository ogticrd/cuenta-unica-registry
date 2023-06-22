export type CitizenBasicInformation = {
  id: string;
  names: string;
  firstSurname: string;
  secondSurname: string;
  gender: 'M' | 'F';
};

export type CitizensBasicInformationResponse = {
  valid: boolean;
  payload: CitizenBasicInformation;
};

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

export type VerifyIamUserNameResponse = {
  data: {
    exists: boolean;
  };
};

export type VerifyIamUserResponse = {
  id: string;
  createdTimestamp: number;
  username: string;
  enabled: boolean;
  totp: boolean;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  email: string;
  attributes: {
    locale: string[];
  };
  disableableCredentialTypes: any[];
  requiredActions: any[];
  notBefore: number;
  access: {
    manageGroupMembership: boolean;
    view: boolean;
    mapRoles: boolean;
    impersonate: boolean;
    manage: boolean;
  };
};
