export type CitizenBasicInformation = {
  id: string;
  names: string;
  firstSurname: string;
  secondSurname: string;
  gender: "M" | "F";
};

export type CitizensBasicInformationResponse = {
  valid: boolean;
  payload: CitizenBasicInformation;
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
