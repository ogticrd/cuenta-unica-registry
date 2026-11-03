import * as Sentry from '@sentry/nextjs';
import type {
  BiometricFailureResponse,
  BiometricSource,
} from '@/common/biometric-contract';

// Never send arbitrary exception names, messages, bodies, or form state.
const ERROR_NAMES = new Set([
  'Error',
  'TypeError',
  'SyntaxError',
  'RangeError',
  'ReferenceError',
  'AbortError',
  'TimeoutError',
  'AxiosError',
  'CredentialsProviderError',
  'AccessDeniedException',
  'InvalidParameterException',
  'ThrottlingException',
  'ProvisionedThroughputExceededException',
  'InternalServerError',
  'ServiceUnavailableException',
  'ResourceNotFoundException',
  'ExpiredTokenException',
  'UnrecognizedClientException',
]);

export function getSafeErrorName(error: unknown) {
  return error instanceof Error && ERROR_NAMES.has(error.name)
    ? error.name
    : 'UnknownError';
}

export function recordCedulaValidationFailure(
  reason:
    | 'missing_api'
    | 'missing_receipt_key'
    | 'invalid_response'
    | 'request_failed',
  error?: unknown,
) {
  Sentry.captureMessage('cedula_validation_unavailable', {
    level: 'error',
    tags: { reason },
    ...(error !== undefined
      ? { extra: { errorName: getSafeErrorName(error) } }
      : {}),
  });
}

const EXPECTED_BIOMETRIC_CODES = new Set([
  'biometric_attempt_limit_exceeded',
  'biometric_cooldown_active',
  'invalid_liveness_session',
  'liveness_low_confidence',
  'face_mismatch',
]);

export function recordBiometricOutcome(
  source: BiometricSource,
  response: BiometricFailureResponse,
) {
  const { code } = response;
  if (EXPECTED_BIOMETRIC_CODES.has(code)) {
    Sentry.addBreadcrumb({
      category: 'biometric',
      message: 'biometric_verification_rejected',
      level: 'info',
      data: { source, code },
    });
  } else {
    Sentry.captureMessage('biometric_verification_failed', {
      level: 'error',
      tags: { source, code },
    });
  }
}

const EXPECTED_DETECTOR_STATES = new Set([
  'CAMERA_ACCESS_ERROR',
  'DEFAULT_CAMERA_NOT_FOUND_ERROR',
  'MOBILE_LANDSCAPE_ERROR',
  'FACE_DISTANCE_ERROR',
  'MULTIPLE_FACES_ERROR',
  'TIMEOUT',
  'FRESHNESS_TIMEOUT',
]);
const FAILURE_DETECTOR_STATES = new Set([
  'CONNECTION_TIMEOUT',
  'RUNTIME_ERROR',
  'SERVER_ERROR',
  'CAMERA_FRAMERATE_ERROR',
]);

export function recordDetectorError(
  source: BiometricSource,
  state: string,
  error: unknown,
) {
  if (EXPECTED_DETECTOR_STATES.has(state)) {
    Sentry.addBreadcrumb({
      category: 'biometric',
      message: 'biometric_liveness_detector_interrupted',
      level: 'info',
      data: { source, detectorState: state },
    });
  } else {
    Sentry.captureMessage('biometric_liveness_detector_error', {
      level: 'error',
      tags: { source },
      extra: {
        detectorState: FAILURE_DETECTOR_STATES.has(state) ? state : 'unknown',
        errorName: getSafeErrorName(error),
      },
    });
  }
}

const EXPECTED_FORM_CODES = new Set([
  'errors.cedula.invalid',
  'errors.recaptcha.issues',
  'errors.recaptcha.validation',
  'errors.recovery.notFound',
  'errors.recovery.sessionExpired',
  'errors.liveness.verificationRequired',
  'errors.code.invalidOrUsed',
]);
const FAILURE_FORM_CODES = new Set([
  'step2.unavailable',
  'errors.unknown',
  'errors.createIdentity',
  'errors.recovery.deleteFailed',
  'Failed to send mail',
]);

type FormName =
  'identification' | 'account_recovery' | 'register' | 'verification';

export function recordFormOutcome(form: FormName, message: string) {
  if (FAILURE_FORM_CODES.has(message)) {
    Sentry.captureMessage('form_operation_failed', {
      level: 'error',
      tags: {
        form,
        code:
          message === 'Failed to send mail'
            ? 'verification_email_failed'
            : message,
      },
    });
  } else {
    // Provider validation text may embed an email, name, or ID. Only keep
    // known application codes; provider failures are reported at the source.
    Sentry.addBreadcrumb({
      category: 'form',
      message: 'form_validation_rejected',
      level: 'info',
      data: {
        form,
        code: EXPECTED_FORM_CODES.has(message)
          ? message
          : 'validation_response',
      },
    });
  }
}

export function recordIdentityProviderFailure(
  operation: 'registration' | 'verification',
  error: unknown,
) {
  const response =
    error && typeof error === 'object' && 'response' in error
      ? error.response
      : undefined;
  const status =
    response &&
    typeof response === 'object' &&
    'status' in response &&
    typeof response.status === 'number' &&
    Number.isInteger(response.status) &&
    response.status >= 100 &&
    response.status <= 599
      ? response.status
      : undefined;
  const data =
    response && typeof response === 'object' && 'data' in response
      ? response.data
      : undefined;
  const ui =
    data && typeof data === 'object' && 'ui' in data ? data.ui : undefined;
  const hasValidationMessages = (value: unknown): boolean =>
    Array.isArray(value) &&
    value.some(
      (message) =>
        message && typeof message === 'object' && message.type === 'error',
    );
  const isValidation =
    ui &&
    typeof ui === 'object' &&
    (('messages' in ui && hasValidationMessages(ui.messages)) ||
      ('nodes' in ui &&
        Array.isArray(ui.nodes) &&
        ui.nodes.some(
          (node) =>
            node &&
            typeof node === 'object' &&
            hasValidationMessages(node.messages),
        )));
  if (status === 400 && isValidation) {
    Sentry.addBreadcrumb({
      category: operation,
      message: `${operation}_validation_rejected`,
      level: 'info',
      data: { status },
    });
    return;
  }
  Sentry.captureMessage(`${operation}_flow_update_failed`, {
    level: 'error',
    tags: { code: `${operation}_flow_update_failed` },
    extra: {
      errorName: getSafeErrorName(error),
      ...(status !== undefined ? { status } : {}),
    },
  });
}
