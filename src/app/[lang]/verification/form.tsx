'use client';

import { TextField, Tooltip, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { z } from 'zod';

import { createVerificationSchema } from '@/common/validation-schemas';
import { GridContainer, GridItem } from '@/components/elements/grid';
import { TextBody } from '@/components/elements/typography';
import { ButtonApp } from '@/components/elements/button';
import LoadingBackdrop from '@/components/elements/loadingBackdrop';
import { VerificationFlow } from '@ory/client';
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
  const { intl } = useLanguage();
  const router = useRouter();

  const { handleSubmit, setValue, watch } = useForm<VerificationForm>({
    reValidateMode: 'onSubmit',
    resolver: zodResolver(createVerificationSchema({ intl })),
  });

  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState(false);
  const [verificationCodes, setVerificationCodes] = useState([
    '',
    '',
    '',
    '',
    '',
    '',
  ]);
  const inputRefs = [
    useRef<HTMLInputElement>(),
    useRef<HTMLInputElement>(),
    useRef<HTMLInputElement>(),
    useRef<HTMLInputElement>(),
    useRef<HTMLInputElement>(),
    useRef<HTMLInputElement>(),
  ];

  const handleCodeChange = (index: number, code: string) => {
    setErrorCode(false);

    const newCodes = [...verificationCodes];
    newCodes[index] = code;
    setVerificationCodes(newCodes);

    if (index < inputRefs.length - 1 && code !== '') {
      inputRefs[index + 1].current?.focus();
    }
    if (code === '' && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '') || '';
    const pastedCodes = pastedData.trim().split('').slice(0, inputRefs.length);

    if (!pastedCodes) {
      return;
    }

    const newCodes = [...verificationCodes];
    pastedCodes.forEach((code: string, index: number) => {
      if (inputRefs[index] && inputRefs[index].current) {
        newCodes[index] = code;
      }
    });

    setVerificationCodes(newCodes);
  };

  const areAllInputsFilled = verificationCodes.every((code) => code !== '');

  useEffect(() => {
    if (areAllInputsFilled) {
      setValue('code', verificationCodes.join(''));
    }
    // eslint-disable-next-line
  }, [areAllInputsFilled, verificationCodes]);

  useEffect(() => {
    if (code) {
      setValue('code', code || '');
    }

    if (currentFlow) return;

    if (flow) {
      ory
        .getVerificationFlow({ id: flow })
        .then(({ data }) => setCurrentFlow(data))
        .catch((err: any) => {
          switch (err.response?.status) {
            case 410:
            // Status code 410 means the request has expired - so let's load a fresh flow!
            case 403:
              // Status code 403 implies some other issue (e.g. CSRF) - let's reload!
              return router.push('/en/verification');
          }

          throw new Error(err);
        });

      return;
    }

    // Otherwise we initialize it
    ory
      .createBrowserVerificationFlow({
        returnTo,
      })
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

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    ory
      .updateVerificationFlow({
        flow: String(flow),
        updateVerificationFlowBody: { method: 'code', code: data.code },
      })
      .then(({ data }) => {
        // Form submission was successful, show the message to the user!
        setCurrentFlow(data);

        router.push('/account-created');
      })
      .catch((err: any) => {
        setErrorCode(true);
        switch (err.response?.status) {
          case 400:
            // Status code 400 implies the form validation had an error
            setCurrentFlow(err.response?.data);
            return;
          case 410:
            const newFlowID = err.response.data.use_flow_id;
            router
              // On submission, add the flow ID to the URL but do not navigate. This prevents the user loosing
              // their data when they reload the page.
              .push(`/verification?flow=${newFlowID}`);

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
      {loading && <LoadingBackdrop />}

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
              {verificationCodes.map((code, index) => (
                <Tooltip title={intl.code.tooltip} key={index}>
                  <TextField
                    value={code}
                    onChange={(newCode: React.ChangeEvent<HTMLInputElement>) =>
                      handleCodeChange(
                        index,
                        newCode.target.value.replace(/\D/g, ''),
                      )
                    }
                    inputRef={inputRefs[index]}
                    onPaste={handlePaste}
                    error={errorCode}
                    required
                    type="text"
                    placeholder="0"
                    autoComplete="off"
                    inputProps={{
                      maxLength: 1,
                      style: {
                        textAlign: 'center',
                      },
                    }}
                    className={styles.verification_input}
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
                {errorCode && intl.errors.code.wrong}
              </Typography>
            </div>
            <br />
            <ButtonApp variant="outlined" disabled={!areAllInputsFilled} submit>
              {intl.actions.verifyAccount}
            </ButtonApp>
          </GridItem>
        </GridContainer>
      </form>
    </>
  );
}
