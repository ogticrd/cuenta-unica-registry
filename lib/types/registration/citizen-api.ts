export interface CitizenBasicInformation {
  id: string;
  names: string;
  firstSurname: string;
  secondSurname: string;
  gender: "M" | "F";
}

export interface CitizenBirthInformation {
  id: string;
  birthPlace: string;
  birthDate: string;
  nationality: string;
}

export interface CitizensBasicInformationResponse {
  valid: boolean;
  payload: CitizenBasicInformation;
}

export interface CitizensBirthInformationResponse {
  valid: boolean;
  payload: CitizenBirthInformation;
}
