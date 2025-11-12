'use client';

import {
  type Control,
  type Path,
  type PathValue,
  type UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import { useReCaptcha } from 'next-recaptcha-v3';
import React from 'react';

const TOKEN_EXPIRY_BUFFER = 90; // 90 seconds (30s buffer before 120s expiry)

type TokenForm = {
  token: string;
};

interface UseRecaptchaTokenProps<T extends TokenForm> {
  setValue: UseFormSetValue<T>;
  control: Control<T>;
  action?: string;
}

export function useRecaptchaToken<T extends TokenForm>({
  setValue,
  control,
  action = 'form_submit',
}: UseRecaptchaTokenProps<T>) {
  const { executeRecaptcha, loaded } = useReCaptcha();
  const [tokenTimestamp, setTokenTimestamp] = React.useState<number | null>(
    null,
  );
  const watchedToken = useWatch({ control, name: 'token' as Path<T> });

  const generateToken = React.useCallback(async () => {
    if (!loaded || !executeRecaptcha) return null;

    try {
      const token = await executeRecaptcha(action);
      setValue('token' as Path<T>, token as PathValue<T, Path<T>>);
      setTokenTimestamp(Date.now());
      return token;
    } catch (error) {
      return null;
    }
  }, [loaded, executeRecaptcha, setValue, action]);

  const isTokenExpired = React.useCallback((): boolean => {
    if (!tokenTimestamp) return true;
    const tokenAge = (Date.now() - tokenTimestamp) / 1000;
    return tokenAge > TOKEN_EXPIRY_BUFFER;
  }, [tokenTimestamp]);

  const ensureValidToken = React.useCallback(async (): Promise<boolean> => {
    const currentToken = watchedToken;

    if (!currentToken || isTokenExpired()) {
      try {
        const newToken = await generateToken();
        return Boolean(newToken);
      } catch {
        return false;
      }
    }

    return true;
  }, [watchedToken, isTokenExpired, generateToken]);

  // Auto-generate token on load
  React.useEffect(() => {
    if (loaded && !watchedToken) {
      generateToken();
    }
  }, [loaded, generateToken, watchedToken]);

  const hasFreshToken = Boolean(watchedToken) && !isTokenExpired();

  return {
    generateToken,
    isTokenExpired,
    ensureValidToken,
    isLoaded: loaded,
    hasFreshToken,
  };
}
