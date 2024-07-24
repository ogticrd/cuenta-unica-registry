'use client';

import { createRef, useEffect, useRef, useState } from 'react';
import { TextField, Tooltip, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { VerificationFlow } from '@ory/client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { z } from 'zod';

import { createVerificationSchema } from '@/common/validation-schemas';
import { GridContainer, GridItem } from '@/components/elements/grid';
import LoadingBackdrop from '@/components/elements/loadingBackdrop';
import { useSnackAlert } from '@/components/elements/alert';
import { TextBody } from '@/components/elements/typography';
import { ButtonApp } from '@/components/elements/button';
import { useLanguage } from '../provider';
import { ory } from '@/common/lib/ory';

import Code from '@public/assets/code.svg';
import styles from './styles.module.css';

type VerificationForm = z.infer<ReturnType<typeof createVerificationSchema>>;
type Props = {
  flow?: string;
  returnTo?: string;
  code?: string;
};

export function Form({ flow, returnTo, code }: Props) {
  const [currentFlow, setCurrentFlow] = useState<VerificationFlow>();
  const { AlertWarning } = useSnackAlert();
  const { intl } = useLanguage();
  const router = useRouter();

  const { handleSubmit, setValue } = useForm<VerificationForm>({
    reValidateMode: 'onSubmit',
    resolver: zodResolver(createVerificationSchema(intl)),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [otp, setOtp] = useState(Array<string>(6).fill(''));
  const inputRefs = useRef(otp.map(() => createRef<HTMLInputElement>()));

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

    // eslint-disable-next-line
  }, [otp]);

  useEffect(() => {
    const validFromQuery = code?.length === 6 && parseOTP(code).length === 6;

    if (validFromQuery) setOtp(parseOTP(code));
    else if (code) {
      AlertWarning(intl.errors.code.badUrl);
    }

    if (currentFlow) return;

    if (flow) {
      ory
        .getVerificationFlow({ id: flow })
        .then(({ data }) => setCurrentFlow(data))
        .catch((err) => {
          switch (err.response?.status) {
            case 410:
            // Status code 410 means the request has expired - so let's load a fresh flow!
            case 403:
            case 404:
              // Status code 403 implies some other issue (e.g. CSRF) - let's reload!
              setOtp(Array<string>(6).fill(''));
              return router.push('/verification');
          }

          throw new Error(err);
        });

      return;
    }

    // Otherwise we initialize it
    ory
      .createBrowserVerificationFlow({ returnTo })
      .then(({ data }) => setCurrentFlow(data))
      .catch((err: any) => {
        switch (err.response?.status) {
          case 400:
            // Status code 400 implies the user is already signed in
            return router.push('/');
        }

        throw new Error(err);
      });
    // eslint-disable-next-line
  }, []);

  const onSubmit = handleSubmit(async ({ code }) => {
    setLoading(true);
    ory
      .updateVerificationFlow({
        flow: String(flow),
        updateVerificationFlowBody: { method: 'code', code },
      })
      .then(({ data }) => {
        // Check for errors
        const errors = data.ui.messages?.filter((msg) => msg.type === 'error');

        if (errors?.length) {
          throw new Error(errors.at(0)?.text);
        }

        router.push('/account-created');
      })
      .catch((err: any) => {
        setError(true);
        switch (err.response?.status) {
          case 400:
            // Status code 400 implies the form validation had an error
            setCurrentFlow(err.response?.data);
            return;
          case 410:
            const newFlowID = err.response.data.use_flow_id;
            // On submission, add the flow ID to the URL but do not navigate.
            // This prevents the user loosing their data when they reload the page.
            router.push(`/verification?flow=${newFlowID}`);

            ory
              .getVerificationFlow({ id: newFlowID })
              .then(({ data }) => setCurrentFlow(data));

            return;
        }

        throw new Error(err);
      })
      .finally(() => setLoading(false));
  });

  return (
    <>
      {loading ? <LoadingBackdrop /> : null}

      <form onSubmit={onSubmit}>
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

const parseOTP = (value: string, size = 6) =>
  value.replace(/\D/g, '').trim().split('').slice(0, size);
