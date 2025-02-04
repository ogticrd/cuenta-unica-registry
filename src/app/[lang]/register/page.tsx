import { Typography, Box } from '@mui/material';
import { redirect } from 'next/navigation';

import { createSearchParams } from '@/common/helpers';
import { getDictionary } from '@/dictionaries';
import { RegistrationFlow } from '@ory/client';
import { Steps } from '@/components/Steps';
import { CitizenCookie } from '@/types';
import { ory } from '@/common/lib/ory';
import { Locale } from '@/i18n-config';
import { getCookie } from '@/actions';
import { Form } from './form';

type Props = {
  params: Promise<{ lang: Locale }>;
  searchParams: Promise<{ flow: string; return_to: string }>;
};

export default async function RegisterPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const { flow, return_to: returnTo } = await searchParams;

  const citizen = await getCookie<CitizenCookie>('citizen');
  const intl = await getDictionary(lang);

  if (!citizen) return redirect('/identification');

  let registration: RegistrationFlow = await ory
    .getRegistrationFlow({ id: flow })
    .catch(() => ory.createNativeRegistrationFlow({ returnTo }))
    .then((response) => response.data);

  if (flow !== registration?.id) {
    const search = createSearchParams({
      flow: registration.id,
      return_to: returnTo,
    });

    redirect(`/register?${search}`);
  }

  return (
    <div>
      <Steps step={2} />
      <Typography
        component="div"
        color="primary"
        textAlign="center"
        sx={{ my: 4, fontSize: '14px' }}
      >
        <Box sx={{ fontWeight: 500 }}>{intl.step3.completeForm}</Box>
      </Typography>

      <Form cedula={citizen?.id} flow={registration.id} returnTo={returnTo} />
    </div>
  );
}
