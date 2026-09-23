import { describe, expect, it } from 'vitest';

import {
  formatRetryAfterSeconds,
  isBiometricResponse,
} from '@/common/biometric-contract';

describe('biometric contract', () => {
  it('formats retry delays for user-facing messages', () => {
    expect(formatRetryAfterSeconds(1, 'es')).toBe('1 segundo');
    expect(formatRetryAfterSeconds(90, 'es')).toBe('2 minutos');
    expect(formatRetryAfterSeconds(1, 'en')).toBe('1 second');
    expect(formatRetryAfterSeconds(90, 'en')).toBe('2 minutes');
  });

  it('validates stable biometric response shapes', () => {
    expect(
      isBiometricResponse({
        success: false,
        code: 'biometric_cooldown_active',
        retryAfterSeconds: 60,
      }),
    ).toBe(true);

    expect(
      isBiometricResponse({
        success: false,
        code: 'raw_aws_error',
      }),
    ).toBe(false);
  });
});
