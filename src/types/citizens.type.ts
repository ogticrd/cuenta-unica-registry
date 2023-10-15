export type CitizenBasicInformation = {
  id: string;
  names: string;
  firstSurname: string;
  secondSurname: string;
  gender: 'M' | 'F';
};
export type CitizenBirthInformation = {
  id: string;
  birthPlace: string;
  birthDate: string;
  nationality: string;
};

export type CitizensBasicInformationResponse = {
  valid: boolean;
  payload: CitizenBasicInformation;
};

export type CitizensBirthInformationResponse = {
  valid: boolean;
  payload: CitizenBirthInformation;
};

export type CitizensTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type CitizensDataFlow = {
  id: string;
  name?: string;
  names?: string;
  firstSurname?: string;
  secondSurname?: string;
  gender?: string;
  birthDate?: string;
};
