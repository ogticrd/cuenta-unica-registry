'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import { LOGIN_URL } from '@/common';
import { useLanguage } from '../provider';

export function Counter() {
  const [count, setCount] = React.useState(5);
  const { intl } = useLanguage();
  const router = useRouter();

  React.useEffect(() => {
    if (count === 0) {
      router.push(LOGIN_URL);
    } else {
      const timer = setTimeout(() => setCount(count - 1), 1_000);

      return () => clearTimeout(timer);
    }
  }, [count, router]);

  return (
    <span
      dangerouslySetInnerHTML={{
        __html: intl.redirection.counter.replace('{count}', String(count)),
      }}
    />
  );
}
