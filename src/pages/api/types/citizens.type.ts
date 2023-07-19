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

export type CitizensTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};
