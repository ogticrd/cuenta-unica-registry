'use server';

import { redirect } from 'next/navigation';

import { createSearchParams } from '@/common/helpers';
import { ory } from '@/common/lib/ory';

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

  redirect('/account-created');
}
