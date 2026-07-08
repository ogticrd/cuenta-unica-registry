'use client';

import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import { ThemeProvider } from '@aws-amplify/ui-react';
import React, { useState, useEffect } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';

import { useSnackAlert } from '@/components/elements/alert';
import { configureAmplifyClient } from '@/common/helpers/amplify-client';
import { localizeString } from '@/common/helpers/localize-string';
import { useLanguage } from '@/app/[lang]/provider';
import { ButtonApp } from '@/components/elements/button';
import { LIVENESS_TIMEOUT_SECONDS } from '@/common';
import {
  BIOMETRIC_ERROR_MESSAGE_KEY_BY_CODE,
  formatRetryAfterSeconds,
  isBiometricResponse,
  type BiometricFailureResponse,
  type BiometricResponse,
  type BiometricSource,
} from '@/common/biometric-contract';
import { useLocalizedText } from './localizedText';

import styles from './styles.module.css';

configureAmplifyClient();

type Props = {
  cedula: string;
  source: BiometricSource;
  flowId?: string;
  redirectUri?: string;
  state?: string;
};

function getSafeErrorName(error: unknown) {
  return error instanceof Error ? error.name : typeof error;
}

export function LivenessQuickStart({
  cedula,
  source,
  flowId,
  redirectUri,
  state,
}: Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState<boolean>(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number>(0);
  const { AlertError, AlertWarning } = useSnackAlert();
  const params = useParams<{ lang?: string }>();
  const router = useRouter();

  const { intl } = useLanguage();

  const displayText = useLocalizedText(intl);
  const displayLocale = params.lang === 'en' ? 'en' : 'es';

  const resolveErrorMessage = (data: BiometricFailureResponse) => {
    if (
      data.code === 'biometric_cooldown_active' ||
      data.code === 'biometric_attempt_limit_exceeded'
    ) {
      const cooldownMessage =
        localizeString(intl, 'errors.liveness.cooldown') ||
        'Debe esperar {time} antes de intentar nuevamente.';
      const retryAfter = formatRetryAfterSeconds(
        data.retryAfterSeconds,
        displayLocale,
      );

      return cooldownMessage
        .replace('{time}', retryAfter)
        .replace('{seconds}', retryAfter);
    }

    const messageKey =
      data.message?.startsWith('errors.') ||
        data.message?.startsWith('liveness.')
        ? data.message
        : BIOMETRIC_ERROR_MESSAGE_KEY_BY_CODE[data.code];

    return messageKey
      ? localizeString(intl, messageKey) || messageKey
      : intl.errors.unknown;
  };

  const readBiometricResponse = async (
    response: Response,
  ): Promise<BiometricResponse> => {
    const data = await response.json().catch(() => null);

    if (!isBiometricResponse(data)) {
      return {
        success: false,
        code: 'unexpected_error',
      };
    }

    if (!response.ok && data.success) {
      return {
        success: false,
        code: 'unexpected_error',
      };
    }

    return data;
  };

  const handleFailedBiometricResponse = (data: BiometricFailureResponse) => {
    const retryAfter = data.retryAfterSeconds ?? 0;

    setRetryAfterSeconds(retryAfter);
    setCanRetry(retryAfter <= 0);
    setError(new Error(resolveErrorMessage(data)));

    Sentry.captureMessage('biometric_verification_failed', {
      tags: { source, code: data.code },
      extra: { retryAfter },
      level: 'warning',
    });
  };

  const resolveDetectorErrorMessage = ({
    message,
    state,
  }: {
    message: string;
    state?: string;
  }) => {
    if (message.includes('Signature')) {
      return intl.liveness.error.signature;
    }

    if (state === 'CAMERA_ACCESS_ERROR') {
      return intl.liveness.camera.notFound.heading;
    }

    if (state === 'MOBILE_LANDSCAPE_ERROR') {
      return intl.liveness.error.landscape.message;
    }

    return intl.errors.liveness.service;
  };

  const fetchCreateLiveness = async ({
    forceNew = false,
  }: { forceNew?: boolean } = {}): Promise<void> => {
    setLoading(true);
    setError(null);
    setCanRetry(false);

    const response = await fetch(`/api/biometric`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source, flowId, forceNew }),
    }).catch((error: unknown) => {
      Sentry.captureMessage('biometric_liveness_session_request_failed', {
        level: 'error',
        tags: { source },
        extra: { errorName: getSafeErrorName(error) },
      });
      return null;
    });

    if (!response) {
      setError(new Error(intl.errors.unknown));
      setCanRetry(true);
      setLoading(false);
      return;
    }

    const data = await readBiometricResponse(response);

    if (!data.success || !data.sessionId) {
      handleFailedBiometricResponse(
        data.success ? { success: false, code: 'unexpected_error' } : data,
      );
      setSessionId(null);
      setLoading(false);
      return;
    }

    setRetryAfterSeconds(0);
    setCanRetry(false);
    setSessionId(data.sessionId);
    setLoading(false);
  };

  const onUserCancel = () => {
    setSessionId(null);
    setCanRetry(true);
    AlertWarning(intl.liveness.error.tryAgain);
  };

  const handleSuccessfulMatch = () => {
    if (!redirectUri) {
      router.push('register');
      return;
    }

    const isExternal = /^https?:\/\//i.test(redirectUri);

    // Build final URL with state parameter if provided
    const buildUrlWithState = (baseUrl: string): string => {
      if (!state) return baseUrl;

      try {
        const url = new URL(baseUrl, window.location.origin);
        url.searchParams.set('state', state);
        return isExternal ? url.toString() : `${url.pathname}${url.search}`;
      } catch {
        // Fallback for simple paths
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}state=${encodeURIComponent(state)}`;
      }
    };

    const destination = redirectUri.startsWith('/')
      ? redirectUri
      : isExternal
        ? redirectUri
        : `/${redirectUri}`;

    const finalUrl = buildUrlWithState(destination);

    if (isExternal) {
      window.location.assign(finalUrl);
      return;
    }

    router.push(finalUrl);
  };

  const handleAnalysisComplete: () => Promise<void> = async () => {
    if (!sessionId) {
      return;
    }

    const params = new URLSearchParams({ source });

    if (flowId) {
      params.set('flowId', flowId);
    }

    const response = await fetch(
      `/api/biometric/${sessionId}/${cedula}?${params.toString()}`,
    ).catch((error: unknown) => {
      Sentry.captureMessage('biometric_result_request_failed', {
        level: 'error',
        tags: { source },
        extra: { errorName: getSafeErrorName(error) },
      });
      return null;
    });

    if (!response) {
      setError(new Error(intl.errors.unknown));
      setCanRetry(true);
      setSessionId(null);
      return;
    }

    const data = await readBiometricResponse(response);

    if (data.success && data.isMatch === true) {
      handleSuccessfulMatch();
      return;
    }

    handleFailedBiometricResponse(
      data.success ? { success: false, code: 'unexpected_error' } : data,
    );
    setSessionId(null);
  };

  useEffect(() => {
    fetchCreateLiveness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const timeout = window.setTimeout(() => {
      setSessionId(null);
      setCanRetry(true);
      setError(new Error('errors.liveness.invalidSession'));
      Sentry.captureMessage('biometric_liveness_session_timed_out', {
        level: 'warning',
        tags: { source },
      });
    }, LIVENESS_TIMEOUT_SECONDS * 1000);

    return () => window.clearTimeout(timeout);
  }, [sessionId, source]);

  useEffect(() => {
    if (!error) return;

    const message: string =
      localizeString(intl, error.message) ||
      error.message ||
      intl.errors.unknown;

    AlertError(message);

    if (!error.message) {
      Sentry.captureMessage('biometric_liveness_unhandled_client_error', {
        level: 'error',
        tags: { source },
        extra: { errorName: getSafeErrorName(error) },
      });
    }

    // TODO: AlertError is causing re-rendering issues. But not adding it causes eslint error.
    // eslint-disable-next-line
  }, [error]);

  useEffect(() => {
    if (retryAfterSeconds <= 0) return;

    const interval = window.setInterval(() => {
      setRetryAfterSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setCanRetry(true);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [retryAfterSeconds]);

  return (
    <ThemeProvider>
      {loading ? (
        <div className={styles.liveness_container}>
          <CircularProgress sx={{ color: 'white' }} />
        </div>
      ) : sessionId ? (
        <FaceLivenessDetector
          sessionId={sessionId}
          region="us-east-1"
          onUserCancel={onUserCancel}
          onError={({ error, state }) => {
            const message = error?.message ?? state;

            Sentry.captureMessage('biometric_liveness_detector_error', {
              tags: { source },
              extra: {
                detectorState: state,
                errorName: getSafeErrorName(error),
              },
              level: 'error',
            });

            setSessionId(null);
            setCanRetry(true);
            setError(
              new Error(
                resolveDetectorErrorMessage({
                  message,
                  state,
                }),
              ),
            );
          }}
          onAnalysisComplete={handleAnalysisComplete}
          disableStartScreen={true}
          displayText={displayText}
        />
      ) : (
        <div className={styles.liveness_container}>
          <Button
            onClick={() => fetchCreateLiveness()}
            disabled={!canRetry || retryAfterSeconds > 0}
            variant="contained"
            color="info"
            size="large"
            sx={{
              color: "#fff",
              borderRadius: "999px",
              "&.Mui-disabled": {
                backgroundColor: "#2962ff",
                color: "#fff",
                opacity: 0.7,
              },
            }}
          >
            {retryAfterSeconds > 0
              ? `${intl.liveness.error.tryAgain} (${formatRetryAfterSeconds(
                retryAfterSeconds,
                displayLocale,
              )})`
              : intl.liveness.error.tryAgain}
          </Button>
        </div>
      )}
    </ThemeProvider>
  );
}
