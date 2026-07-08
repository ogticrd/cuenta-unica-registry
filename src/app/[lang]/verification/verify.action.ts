'use server';

import { redirect } from 'next/navigation';

import { createSearchParams } from '@/common/helpers/create-search-params';
import { ory } from '@/common/lib/ory';
import { setCookie, getCookie, removeCookie } from '@/actions';
import { CitizenCookie } from '@/types';

type State = { message: string };

export async function verifyAccount(prev: State, form: FormData) {
  const flow = form.get('flow') as string;
  const code = form.get('code') as string;

  const verification = await ory
    .updateVerificationFlow({
      flow,
      updateVerificationFlowBody: { method: 'code', code },
    })
    .then((res) => res.data)
    .catch<{ use_flow_id: string }>((err) => err.response.data);

  if ('ui' in verification) {
    for (const { type, text } of verification.ui.messages ?? []) {
      if (type === 'error') {
        if (text === 'The verification code is invalid or has already been used. Please try again.') {
          return { message: 'errors.code.invalidOrUsed' };
        }
        return { message: text };
      }
    }
  }

  if ('use_flow_id' in verification) {
    const search = createSearchParams({
      flow: verification.use_flow_id,
    });

    redirect(`/verification?${search}`);
  }

  // Save citizen data for the account-created page before clearing registration cookies
  const citizen = await getCookie<CitizenCookie>('citizen');
  if (citizen) {
    await setCookie('account_created', { name: citizen.name, id: citizen.id });
  }

  // Clear registration flow cookies to prevent back-navigation into the flow
  await removeCookie('citizen');

  setCookie('_sid', 0);
  redirect('/account-created');
}
