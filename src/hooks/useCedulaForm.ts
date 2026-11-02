'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useReCaptcha } from 'next-recaptcha-v3';
import type { z } from 'zod';

import type { Context } from '@/app/[lang]/provider';
import { checkCedulaException } from '@/actions/cedula-validation.action';
import { createCedulaSchema } from '@/common/validation-schemas/cedula.schema';

type CedulaForm = z.infer<ReturnType<typeof createCedulaSchema>>;
type ExceptionResult = Awaited<ReturnType<typeof checkCedulaException>>;

export function useCedulaForm(intl: Context['intl']) {
  const { executeRecaptcha, loaded } = useReCaptcha();
  const sequence = useRef(0);
  const retryBackoff = useRef({ failures: 0, until: 0, pending: false });
  const [retryAt, setRetryAt] = useState(0);

  useEffect(() => {
    if (!retryAt) return;
    const timer = setTimeout(
      () => setRetryAt(0),
      Math.max(0, retryAt - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [retryAt]);
  const lastCheck = useRef<{
    cedula: string;
    result: Promise<ExceptionResult>;
    expiresAt?: number;
  } | null>(null);
  const [validation, setValidation] = useState<{
    cedula: string;
    status: 'incomplete' | 'pending' | 'valid' | 'invalid' | 'retry';
    receipt: string;
  }>({ cedula: '', status: 'incomplete', receipt: '' });

  const checkException = useCallback(
    async (cedula: string, isCurrent: () => boolean) => {
      // Keep the active request reusable. Only the latest different input
      // should start a lookup after it completes.
      while (
        retryBackoff.current.pending &&
        lastCheck.current &&
        lastCheck.current.cedula !== cedula
      ) {
        await lastCheck.current.result;
        if (!isCurrent()) return 'unavailable';
      }
      if (!isCurrent()) return 'unavailable';
      let check = lastCheck.current;
      if (
        !check ||
        check.cedula !== cedula ||
        (check.expiresAt !== undefined && check.expiresAt <= Date.now())
      ) {
        const result = (async (): Promise<ExceptionResult> => {
          const backoff = retryBackoff.current;
          // Editing the ID or invoking retry directly must not bypass the delay.
          if (backoff.pending || Date.now() < backoff.until)
            return { status: 'unavailable' };
          backoff.pending = true;
          let response: ExceptionResult;
          try {
            if (!loaded || !executeRecaptcha) {
              response = { status: 'recaptcha' };
            } else {
              const token = await executeRecaptcha('form_submit');
              response = await checkCedulaException(cedula, token);
            }
          } catch {
            response = { status: 'unavailable' };
          } finally {
            backoff.pending = false;
          }
          if (
            response.status === 'unavailable' ||
            response.status === 'recaptcha'
          ) {
            backoff.failures = Math.min(backoff.failures + 1, 5);
            backoff.until =
              Date.now() +
              Math.min(2_000 * 2 ** (backoff.failures - 1), 30_000);
          } else {
            backoff.failures = 0;
            backoff.until = 0;
          }
          setRetryAt(backoff.until);
          return response;
        })();
        check = { cedula, result };
        lastCheck.current = check;
      }
      const result = await check.result;
      if ('expiresAt' in result) check.expiresAt = result.expiresAt;
      return result.status;
    },
    [loaded, executeRecaptcha],
  );

  const form = useForm<CedulaForm>({
    defaultValues: { cedula: '', token: '' },
  });
  const cedula = useWatch({ control: form.control, name: 'cedula' });
  const { setValue, clearErrors, setError, getValues } = form;

  const validateInput = useCallback(
    async (value: string, retry = false) => {
      if (
        retry &&
        (retryBackoff.current.pending ||
          Date.now() < retryBackoff.current.until)
      )
        return false;
      const current = ++sequence.current;
      if (retry) lastCheck.current = null;
      setValue('cedula', value, { shouldDirty: true, shouldValidate: false });
      clearErrors('cedula');
      const complete = /^\d{11}$/.test(value);
      setValidation({
        cedula: value,
        status: complete ? 'pending' : 'incomplete',
        receipt: '',
      });
      if (!complete) return false;

      const schema = createCedulaSchema(intl, (cedula) =>
        checkException(cedula, () => current === sequence.current),
      );
      const result = await schema.shape.cedula.safeParseAsync(value);
      if (current !== sequence.current || getValues('cedula') !== value)
        return false;
      const exception =
        lastCheck.current?.cedula === value
          ? await lastCheck.current.result
          : null;
      if (current !== sequence.current || getValues('cedula') !== value)
        return false;
      if (!result.success) {
        setError('cedula', {
          type: 'validate',
          message: result.error.issues[0].message,
        });
      }
      setValidation({
        cedula: value,
        status: result.success
          ? 'valid'
          : exception?.status === 'unavailable' ||
              exception?.status === 'recaptcha'
            ? 'retry'
            : 'invalid',
        receipt: exception && 'receipt' in exception ? exception.receipt : '',
      });
      return result.success;
    },
    [intl, checkException, setValue, clearErrors, setError, getValues],
  );

  return {
    ...form,
    cedula,
    validateInput,
    checkingCedula: validation.status === 'pending',
    canSubmitCedula:
      validation.cedula === cedula && validation.status === 'valid',
    canRetryCedula:
      validation.cedula === cedula &&
      validation.status === 'retry' &&
      retryAt === 0,
    // Reuse only the server-signed result for the exact current input.
    cedulaReceipt: validation.cedula === cedula ? validation.receipt : '',
  };
}
