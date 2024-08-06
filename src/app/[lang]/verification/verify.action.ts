'use server';

import { redirect } from 'next/navigation';

import { ory } from '@/common/lib/ory';

type State = { message: string };

export async function verifyAccount(prev: State, form: FormData) {
  const flow = form.get('flow') as string;
  const code = form.get('code') as string;

  const { data } = await ory.updateVerificationFlow({
    flow,
    updateVerificationFlowBody: { method: 'code', code },
  });

  for (const { type, text } of data.ui.messages ?? []) {
    if (type === 'error') {
      return { message: text };
    }
  }

  redirect('account-created');

  // Err
  //   switch (err.response?.status) {
  //     case 400:
  //       setCurrentFlow(err.response?.data);
  //       break;
  //     case 410:
  //       const newFlowID = err.response.data.use_flow_id;
  //       router.push(`/verification?flow=${newFlowID}`);
  //       ory
  //         .getVerificationFlow({ id: newFlowID })
  //         .then(({ data }) => setCurrentFlow(data));
  //       break;
  //     default:
  //       throw new Error(err);
  //   }
}
