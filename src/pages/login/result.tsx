import { orySdk } from '@/sdk';
import { SettingsFlow } from '@ory/client';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react';

export default function Result() {
  const [session, setSession] = useState<string>(
    "No valid Ory Session was found.\nPlease sign in to receive one.",
  )
  const [hasSession, setHasSession] = useState<boolean>(false)
  const router = useRouter()

  useEffect(() => {
    orySdk
      .toSession()
      .then(({ data }) => {
        setSession(JSON.stringify(data, null, 2))
        setHasSession(true)
      })
      .catch((err) => {
        switch (err.response?.status) {
          case 403:
          // This is a legacy error code thrown. See code 422 for
          // more details.
          case 422:
            // This status code is returned when we are trying to
            // validate a session which has not yet completed
            // its second factor
            return router.push("/login?aal=aal2")
          case 401:
            // do nothing, the user is not logged in
            return
        }

        // Something else happened!
        return Promise.reject(err)
      })
  }, [router])
  return (
    <div className="">
      {session}
    </div>
  )
} 