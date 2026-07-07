export const BIOMETRIC_SOURCES = ['registration', 'vid'] as const;

export type BiometricSource = (typeof BIOMETRIC_SOURCES)[number];

export const BIOMETRIC_ERROR_CODES = [
  'biometric_attempt_limit_exceeded',
  'biometric_cooldown_active',
  'invalid_liveness_session',
  'liveness_low_confidence',
  'face_mismatch',
  'jce_photo_unavailable',
  'rekognition_error',
  'unexpected_error',
] as const;

export type BiometricErrorCode = (typeof BIOMETRIC_ERROR_CODES)[number];

export type BiometricSuccessResponse = {
  success: true;
  sessionId?: string;
  isMatch?: boolean;
  confidence?: number;
  similarity?: number;
};

export type BiometricFailureResponse = {
  success: false;
  code: BiometricErrorCode;
  message?: string;
  retryAfterSeconds?: number;
};

export type BiometricResponse =
  | BiometricSuccessResponse
  | BiometricFailureResponse;

export const BIOMETRIC_ERROR_MESSAGE_KEY_BY_CODE = {
  biometric_attempt_limit_exceeded: 'errors.liveness.cooldown',
  biometric_cooldown_active: 'errors.liveness.cooldown',
  invalid_liveness_session: 'errors.liveness.invalidSession',
  liveness_low_confidence: 'errors.liveness.lowConfidence',
  face_mismatch: 'errors.liveness.noMatch',
  jce_photo_unavailable: 'errors.liveness.noMatch',
  rekognition_error: 'errors.liveness.service',
  unexpected_error: 'errors.unknown',
} satisfies Record<BiometricErrorCode, string>;

export type BiometricDisplayLocale = 'es' | 'en';

export function isBiometricSource(value: unknown): value is BiometricSource {
  return BIOMETRIC_SOURCES.includes(value as BiometricSource);
}

export function isBiometricErrorCode(
  value: unknown,
): value is BiometricErrorCode {
  return BIOMETRIC_ERROR_CODES.includes(value as BiometricErrorCode);
}

export function isBiometricResponse(
  value: unknown,
): value is BiometricResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const response = value as Partial<BiometricResponse>;

  if (response.success === true) {
    return true;
  }

  return response.success === false && isBiometricErrorCode(response.code);
}

export function formatRetryAfterSeconds(
  value: number | undefined,
  locale: BiometricDisplayLocale = 'es',
) {
  const seconds = Math.max(0, Math.ceil(value ?? 0));

  if (seconds < 60) {
    if (locale === 'en') {
      return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
    }

    return `${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`;
  }

  const minutes = Math.ceil(seconds / 60);

  if (locale === 'en') {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }

  return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
}
