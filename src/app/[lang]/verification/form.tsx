'use client';

import { createRef, useEffect, useRef, useState, useActionState } from 'react';
import { TextField, Tooltip, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as Sentry from '@sentry/nextjs';
import Image from 'next/image';
import { z } from 'zod';

import { createVerificationSchema } from '@/common/validation-schemas';
import { GridContainer, GridItem } from '@/components/elements/grid';
import LoadingBackdrop from '@/components/elements/loadingBackdrop';
import { useSnackAlert } from '@/components/elements/alert';
import { TextBody } from '@/components/elements/typography';
import { ButtonApp } from '@/components/elements/button';
import { verifyAccount } from './verify.action';
import { useLanguage } from '../provider';

import Code from '@public/assets/code.svg';
import styles from './styles.module.css';

type VerificationForm = z.infer<ReturnType<typeof createVerificationSchema>>;
type Props = {
  flow: string;
  returnTo?: string;
  code?: string;
};

export function Form({ flow, returnTo, code }: Props) {
  const { AlertError } = useSnackAlert();
  const { intl } = useLanguage();

  const { setValue, watch } = useForm<VerificationForm>({
    reValidateMode: 'onSubmit',
    resolver: zodResolver(createVerificationSchema(intl)),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [otp, setOtp] = useState(parseOTP(code));
  const inputRefs = useRef(otp.map(createRef<HTMLInputElement>));

  const [state, action] = useActionState(verifyAccount, { message: '' });

  useEffect(() => {
    if (state?.message) {
      setLoading(false);
      setError(true);

      Sentry.captureMessage(state.message, {
        extra: { state, error: state?.message, flow },
        level: 'error',
      });

      AlertError(state.message);
    }
    // eslint-disable-next-line
  }, [state]);

  const handleChange = (value: string, index: number) => {
    if (isNaN(+value)) return false;

    setError(false);
    setOtp(Object.assign([...otp], { [index]: value }));

    const nextRef = inputRefs.current[index + 1];
    const prevRef = inputRefs.current[index - 1];

    if (nextRef?.current && value) {
      nextRef.current.focus();
    }

    if (prevRef?.current && !value) {
      prevRef.current.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = parseOTP(e.clipboardData.getData('text'));

    if (text.length === 6) {
      setOtp(text);
      // @ts-ignore
      e.target.blur(); // `target` is supossed to be `HTMLInputElement`
    }
  };

  useEffect(() => {
    if (otp.every(Boolean)) setValue('code', otp.join(''));
  }, [otp, setValue]);

  return (
    <>
      {loading ? <LoadingBackdrop /> : null}

      <form action={action}>
        <input type="hidden" name="flow" value={flow} />
        <input type="hidden" name="return_to" value={returnTo} />
        <input type="hidden" name="code" value={watch('code')} />

        <GridContainer>
          <GridItem md={12} lg={12}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Image
                src={Code?.src}
                alt="imagen de código"
                width="177"
                height="196"
              />
            </div>
            <br />
            <Typography
              color="primary"
              sx={{
                fontSize: '24px',
                fontWeight: '700',
                textAlign: 'center',
              }}
              gutterBottom
            >
              {intl.code.title}
            </Typography>
            <TextBody textCenter gutterBottom>
              {intl.code.body}
            </TextBody>
            <br />
            <div className={styles.verification_codes}>
              {otp.map((code, index) => (
                <Tooltip title={intl.code.tooltip} key={index}>
                  <TextField
                    value={code}
                    onChange={({ target }) => handleChange(target.value, index)}
                    inputRef={inputRefs.current[index]}
                    onPaste={handlePaste}
                    error={error}
                    required
                    placeholder="0"
                    autoComplete="off"
                    inputProps={{
                      maxLength: 1,
                      inputMode: 'numeric',
                      style: {
                        textAlign: 'center',
                      },
                    }}
                    className={styles.verification_input}
                    sx={{ caretColor: 'transparent' }}
                  />
                </Tooltip>
              ))}
            </div>
            <div className={styles.error_code}>
              <Typography
                color="secondary"
                sx={{
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                {error ? intl.errors.code.wrong : null}
              </Typography>
            </div>
            <br />
            <ButtonApp variant="outlined" disabled={!otp.every(Boolean)} submit>
              {intl.actions.verifyAccount}
            </ButtonApp>
          </GridItem>
        </GridContainer>
      </form>
    </>
  );
}

function parseOTP(value: string | undefined, size = 6) {
  if (!value) return Array<string>(6).fill('');

  return value.replace(/\D/g, '').trim().split('').slice(0, size);
}
