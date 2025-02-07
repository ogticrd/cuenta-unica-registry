import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createSearchParams } from '@/common/helpers';
import { ory } from '@/common/lib/ory';
import { Form } from './form';

type Props = {
  searchParams: Promise<{ flow: string; returnTo?: string; code: string }>;
};

export default async function VerificationPage({ searchParams }: Props) {
  const { flow, returnTo, code } = await searchParams;
  const validated = z.string().length(6).safeParse(code);

  if (code && validated.data !== code) {
    const search = createSearchParams({
      flow,
      return_to: returnTo || '',
    });

    redirect(`/verification?${search}`);
  }

  const verificationFlow = await ory
    .getVerificationFlow({ id: flow })
    .then((response) => response.data)
    .catch((err) => {
      switch (err.response?.status) {
        case 410:
        // Status code 410 means the request has expired - so let's load a fresh flow!
        // This needs the email of the user.
        case 403:
        case 404:
          // Status code 403 implies some other issue (e.g. CSRF) - let's reload!
          return redirect('/confirmation');
      }
    });

  return (
    <Form
      flow={verificationFlow?.id || ''}
      returnTo={returnTo}
      code={validated.data}
    />
  );
}
