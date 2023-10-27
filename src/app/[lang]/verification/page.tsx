import { Form } from './form';

type Props = {
  searchParams: { flow?: string; returnTo?: string; code: string };
};

export default async function VerificationPage({
  searchParams: { flow, returnTo, code },
}: Props) {
  return <Form flow={flow} returnTo={returnTo} code={code} />;
}
