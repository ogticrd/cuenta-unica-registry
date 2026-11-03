import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import {
  getSafeErrorName,
  recordBiometricOutcome,
  recordDetectorError,
  recordFormOutcome,
  recordIdentityProviderFailure,
} from '@/common/helpers/sentry-telemetry';
import { BIOMETRIC_ERROR_CODES } from '@/common/biometric-contract';

vi.mock('@sentry/nextjs', () => ({
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
}));
beforeEach(() => vi.clearAllMocks());

const privateMessage =
  'Citizen 00000000001 test@example.test access_token=private-token';
function expectNoPrivateContext() {
  const telemetry = JSON.stringify([
    vi.mocked(Sentry.captureMessage).mock.calls,
    vi.mocked(Sentry.addBreadcrumb).mock.calls,
  ]);
  for (const value of ['00000000001', 'test@example.test', 'private-token'])
    expect(telemetry).not.toContain(value);
}

describe('biometric telemetry', () => {
  it.each(BIOMETRIC_ERROR_CODES)(
    'classifies %s without forwarding response messages',
    (code) => {
      recordBiometricOutcome('registration', {
        success: false,
        code,
        message: privateMessage,
      });
      const serviceFailure = [
        'jce_photo_unavailable',
        'rekognition_error',
        'unexpected_error',
      ].includes(code);
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(
        serviceFailure ? 1 : 0,
      );
      expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(
        serviceFailure ? 0 : 1,
      );
      if (serviceFailure)
        expect(Sentry.captureMessage).toHaveBeenCalledWith(
          'biometric_verification_failed',
          expect.objectContaining({ level: 'error' }),
        );
      expectNoPrivateContext();
    },
  );
  it.each([
    'CAMERA_ACCESS_ERROR',
    'DEFAULT_CAMERA_NOT_FOUND_ERROR',
    'MOBILE_LANDSCAPE_ERROR',
    'FACE_DISTANCE_ERROR',
    'MULTIPLE_FACES_ERROR',
    'TIMEOUT',
    'FRESHNESS_TIMEOUT',
  ])('keeps %s out of error events', (state) => {
    recordDetectorError('vid', state, new Error(privateMessage));
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
    expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(1);
    expectNoPrivateContext();
  });
  it.each([
    'SERVER_ERROR',
    'CONNECTION_TIMEOUT',
    'RUNTIME_ERROR',
    'CAMERA_FRAMERATE_ERROR',
    privateMessage,
  ])('retains actual or unknown detector failures: %s', (state) => {
    const error = new Error(privateMessage);
    error.name = privateMessage;
    recordDetectorError('vid', state, error);
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'biometric_liveness_detector_error',
      expect.objectContaining({ level: 'error' }),
    );
    expectNoPrivateContext();
  });
});

describe('form telemetry', () => {
  it.each([
    'errors.cedula.invalid',
    'errors.code.invalidOrUsed',
    'errors.recovery.notFound',
    'errors.recaptcha.validation',
    'errors.recovery.sessionExpired',
    privateMessage,
  ])('records validation without an error event: %s', (message) => {
    recordFormOutcome('register', message);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
    expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(1);
    expectNoPrivateContext();
  });
  it.each([
    'step2.unavailable',
    'errors.createIdentity',
    'errors.recovery.deleteFailed',
    'errors.unknown',
    'Failed to send mail',
  ])('retains genuine failures: %s', (message) => {
    recordFormOutcome('register', message);
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'form_operation_failed',
      expect.objectContaining({ level: 'error' }),
    );
  });
  it('classifies an Ory validation response without including its body', () => {
    recordIdentityProviderFailure('registration', {
      response: {
        status: 400,
        data: { ui: { messages: [{ type: 'error', text: privateMessage }] } },
      },
    });
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
    expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(1);
    expectNoPrivateContext();
  });
  it.each([401, 403, 429, 500, 502, undefined])(
    'retains provider failure status %s',
    (status) => {
      recordIdentityProviderFailure('registration', {
        response: {
          status,
          data: { ui: { messages: [{ type: 'error', text: privateMessage }] } },
        },
      });
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'registration_flow_update_failed',
        expect.objectContaining({ level: 'error' }),
      );
      expectNoPrivateContext();
    },
  );
});

it('only retains known error names', () => {
  expect(getSafeErrorName(new TypeError(privateMessage))).toBe('TypeError');
  const error = new Error(privateMessage);
  error.name = privateMessage;
  expect(getSafeErrorName(error)).toBe('UnknownError');
  expect(getSafeErrorName({ message: privateMessage })).toBe('UnknownError');
});

it('does not mistake a malformed provider response for expected validation', () => {
  recordIdentityProviderFailure('verification', {
    response: { status: 400, data: { ui: {} } },
  });
  expect(Sentry.captureMessage).toHaveBeenCalledWith(
    'verification_flow_update_failed',
    expect.objectContaining({ level: 'error' }),
  );
  expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
});

it('records expected verification errors without forwarding provider text', () => {
  recordIdentityProviderFailure('verification', {
    response: {
      status: 400,
      data: {
        ui: {
          nodes: [{ messages: [{ type: 'error', text: privateMessage }] }],
        },
      },
    },
  });
  expect(Sentry.captureMessage).not.toHaveBeenCalled();
  expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'verification_validation_rejected' }),
  );
  expectNoPrivateContext();
});
