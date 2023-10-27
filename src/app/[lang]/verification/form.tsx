'use client';

import { TextField, Tooltip, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { z } from 'zod';

import { createVerificationSchema } from '@/common/validation-schemas';
import { GridContainer, GridItem } from '@/components/elements/grid';
import { TextBody } from '@/components/elements/typography';
import { ButtonApp } from '@/components/elements/button';
import { VerificationFlow } from '@ory/client';
import { useLanguage } from '../provider';
import { ory } from '@/common/lib/ory';

import Code from '@public/assets/code.svg';

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

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VerificationForm>({
    reValidateMode: 'onSubmit',
    resolver: zodResolver(createVerificationSchema({ intl })),
  });

  useEffect(() => {
    setValue('code', code || '');
    // If the router is not ready yet, or we already have a flow, do nothing.
    // if (flow) {
    //   return;
    // }

    // If ?flow=.. was in the URL, we fetch it
    if (flow) {
      ory
        .getVerificationFlow({ id: flow })
        .then(({ data }) => {
          setCurrentFlow(data);
        })
        .catch((err: any) => {
          switch (err.response?.status) {
            case 410:
            // Status code 410 means the request has expired - so let's load a fresh flow!
            case 403:
              // Status code 403 implies some other issue (e.g. CSRF) - let's reload!
              return router.push('/verification');
          }

          throw err;
        });
      return;
    }

    // Otherwise we initialize it
    ory
      .createBrowserVerificationFlow({
        returnTo,
      })
      .then(({ data }) => {
        setCurrentFlow(data);
      })
      .catch((err: any) => {
        switch (err.response?.status) {
          case 400:
            // Status code 400 implies the user is already signed in
            return router.push('/');
        }

        throw err;
      });
  }, [currentFlow, router, returnTo, flow]);

  const codeFormValue = watch('code', '');

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue('code', event.target.value);
  };

  const onSubmit = handleSubmit(async (data) => {
    await router
      // On submission, add the flow ID to the URL but do not navigate. This prevents the user loosing
      // their data when they reload the page.
      .push(`/verification?flow=${flow}`);

    ory
      .updateVerificationFlow({
        flow: String(flow),
        updateVerificationFlowBody: { method: 'code', code: data.code },
      })
      .then(({ data }) => {
        // Form submission was successful, show the message to the user!
        setCurrentFlow(data);
      })
      .catch((err: any) => {
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

        throw err;
      });
  });

  return (
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
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Tooltip title={intl.code.tooltip}>
              <TextField
                value={codeFormValue}
                onChange={onChange}
                required
                type="text"
                placeholder="0-0-0-0-0-0"
                autoComplete="off"
                sx={{ textAlign: 'center', width: '9em' }}
              />
            </Tooltip>
          </div>
          <br />
        </GridItem>

        <ButtonApp variant="outlined" submit>
          {intl.actions.verifyAccount}
        </ButtonApp>
      </GridContainer>
    </form>
  );
}
