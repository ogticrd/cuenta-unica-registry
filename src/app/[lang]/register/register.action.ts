'use server';

import { redirect } from 'next/navigation';

import { findCitizen, findIamCitizen } from '@/actions';
import { createSearchParams } from '@/common/helpers';
import { ory } from '@/common/lib/ory';

async function verify(email: string) {
  const { data } = await ory.createNativeVerificationFlow();
  return ory
    .updateVerificationFlow({
      flow: data.id,
      updateVerificationFlowBody: {
        method: 'code',
        email,
      },
    })
    .then((res) => res.data);
}

type State = {
  message: string;
};

export async function verifyUser(prev: State, form: FormData) {
  const email = form.get('email') as string;

  try {
    const verificationFlow = await verify(email);
    const search = createSearchParams({
      flow: verificationFlow.id,
      return_to: String(form.get('return_to')),
    });

    redirect(`verification?${search}`);
  } catch (error) {
    return { message: 'Algo pasó' };
  }
}

export async function registerAccount(prev: State, form: FormData) {
  const cedula: string = form.get('cedula') as string;
  const email: string = form.get('email') as string;

  const { exists } = await findIamCitizen(cedula);

  if (exists) {
    const verificationFlow = await verify(email);
    const search = createSearchParams({
      flow: verificationFlow.id,
      return_to: String(form.get('return_to')),
    });

    redirect(`verification?${search}`);
  }

  const citizen = await findCitizen(cedula, true);
  const { data } = await ory.updateRegistrationFlow({
    flow: form.get('flow') as string,
    updateRegistrationFlowBody: {
      method: 'password',
      password: form.get('password') as string,
      traits: {
        email,
        username: citizen.id,
        name: {
          first: citizen.names,
          last: [citizen.firstSurname, citizen.secondSurname]
            .filter(Boolean)
            .join(' '),
        },
        birthdate: citizen.birthDate,
        gender: citizen.gender,
      },
    },
  });

  for (const block of data.continue_with || []) {
    if (block.action === 'show_verification_ui') {
      const search = createSearchParams({
        flow: block.flow.id,
        return_to: String(form.get('return_to')),
      });

      redirect(`verification?${search}`);
    }
  }

  return { message: 'intl.errors.createIdentity' };
}

const logError = (err: any) => {
  if (err.response?.data) {
    const { ui, error } = err.response.data;
    const messages = [
      ...(ui?.messages || []),
      ...(ui?.nodes?.flatMap((n: any) => n.messages) || []),
      error?.id,
    ]
      .filter((msg: any) => msg?.type === 'error')
      .map((msg: any) => msg?.text)
      .filter(Boolean);

    const message = messages.join(', ');

    // Sentry.captureMessage(message, {
    //   user: { id: cedula, email: getValues('email') },
    //   level: 'error',
    //   extra: { errors: messages },
    // });
  }
};
