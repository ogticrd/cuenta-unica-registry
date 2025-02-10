'use server';

import type { RegistrationFlow, VerificationFlow } from '@ory/client';
import { redirect } from 'next/navigation';

import { findCitizen, findIamCitizen } from '@/actions';
import { createSearchParams } from '@/common/helpers';
import { ory } from '@/common/lib/ory';
import { State } from '@/types';

async function verify(email: string): Promise<VerificationFlow> {
  const flow = await ory
    .createNativeVerificationFlow()
    .then((res) => res.data.id);

  return ory
    .updateVerificationFlow({
      flow,
      updateVerificationFlowBody: {
        method: 'code',
        email,
      },
    })
    .then((res) => res.data)
    .catch((err) => err.response.data);
}

export async function verifyUser(prev: State, form: FormData): Promise<State> {
  const email = form.get('email') as string;
  const return_to = form.get('return_to') as string;

  const flow = await verify(email);

  for (const node of flow.ui.nodes ?? []) {
    for (const { type, text } of node.messages) {
      if (type === 'error') return { message: text };
    }
  }

  for (const { type, text } of flow.ui.messages ?? []) {
    if (type === 'error') {
      return { message: text };
    }
  }

  if (flow.state === 'sent_email') {
    const search = createSearchParams({
      flow: flow.id,
      return_to,
    });

    redirect(`../verification?${search}`);
  }

  return { message: 'Failed to send mail' };
}

export async function registerAccount(
  prev: State,
  form: FormData,
): Promise<State> {
  const cedula: string = form.get('cedula') as string;
  const email: string = form.get('email') as string;
  const flow: string = form.get('flow') as string;

  const meta = { cedula, flow };

  const { exists } = await findIamCitizen(cedula);

  if (exists) {
    const verificationFlow = await verify(email);
    const search = createSearchParams({
      flow: verificationFlow.id,
      return_to: String(form.get('return_to')),
    });

    redirect(`../verification?${search}`);
  }

  const citizen = await findCitizen(cedula, true);
  const registration = await ory
    .updateRegistrationFlow({
      flow,
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
    })
    .then((res) => res.data)
    .catch<RegistrationFlow>((err) => err.response.data);

  if ('ui' in registration) {
    for (const node of registration.ui.nodes) {
      for (const { type, text } of node.messages) {
        if (type === 'error') return { message: text, meta };
      }
    }

    for (const { type, text } of registration.ui.messages ?? []) {
      if (type === 'error') {
        return { message: text, meta };
      }
    }
  }

  if ('continue_with' in registration && registration.continue_with) {
    for (const block of registration.continue_with) {
      if (block.action === 'show_verification_ui') {
        const search = createSearchParams({
          flow: block.flow.id,
          return_to: String(form.get('return_to')),
        });

        redirect(`../verification?${search}`);
      }
    }
  }

  return { message: 'errors.createIdentity', meta };
}
