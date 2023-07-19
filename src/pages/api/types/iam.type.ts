export interface Identity {
  id: string;
  credentials: Credentials;
  schema_id: string;
  schema_url: string;
  state: string;
  state_changed_at: string;
  traits: Traits;
  verifiable_addresses: VerifiableAddress[];
  recovery_addresses: RecoveryAddress[];
  metadata_public: any;
  metadata_admin: any;
  created_at: string;
  updated_at: string;
}

export interface Credentials {
  password: Password;
  webauthn: Webauthn;
}

export interface Password {
  type: string;
  identifiers: string[];
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Webauthn {
  type: string;
  identifiers: string[];
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Traits {
  cedula: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface VerifiableAddress {
  id: string;
  value: string;
  verified: boolean;
  via: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RecoveryAddress {
  id: string;
  value: string;
  via: string;
  created_at: string;
  updated_at: string;
}
