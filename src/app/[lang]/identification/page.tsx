import { redirect } from 'next/navigation';

import { SETTINGS_URL } from '@/common';
import { session } from '@/common/lib';
import { Form } from './form';

export default async function ValidationPage() {
  const user = await session();

  for (const addr of user.identity?.verifiable_addresses ?? []) {
    if (!addr.verified) redirect(`/confirmation?email=${addr.value}`);
  }

  if (user.active) {
    return redirect(SETTINGS_URL);
  }

  return <Form />;
}
