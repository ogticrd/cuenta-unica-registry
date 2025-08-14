'use client';

import { Control, UseFormSetValue, useWatch } from 'react-hook-form';
import { useReCaptcha } from 'next-recaptcha-v3';
import React from 'react';

const TOKEN_EXPIRY_BUFFER = 90; // 90 seconds (30s buffer before 120s expiry)

type TokenForm = {
  token: string;
};

interface UseRecaptchaTokenProps {
  setValue: UseFormSetValue<any>;
  control: Control<any>;
  action?: string;
}

export function useRecaptchaToken({
  setValue,
  control,
  action = 'form_submit',
}: UseRecaptchaTokenProps) {
  const { executeRecaptcha, loaded } = useReCaptcha();
  const tokenTimeRef = React.useRef<number | null>(null);
  const watchedToken = useWatch<TokenForm>({ control, name: 'token' });

  const generateToken = React.useCallback(async (): Promise<string | null> => {
    if (!loaded || !executeRecaptcha) return null;

    try {
      const token = await executeRecaptcha(action);
      setValue('token', token);
      tokenTimeRef.current = Date.now();
      return token;
    } catch (error) {
      return null;
    }
  }, [loaded, executeRecaptcha, setValue, action]);

  const isTokenExpired = React.useCallback((): boolean => {
    if (!tokenTimeRef.current) return true;
    const tokenAge = (Date.now() - tokenTimeRef.current) / 1000;
    return tokenAge > TOKEN_EXPIRY_BUFFER;
  }, []);

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
