import { writeFile } from 'node:fs/promises'
import { z } from 'zod'
import { getApiTokens } from './get-api-tokens.js'
import { createEncodedPayload } from './create-encoded-payload.js'
;(async () => {
  const usersList = await (
    await fetch('https://challenge.sunvoy.com/api/users', {
      headers: {
        // TODO: investigate cookie situation...
        cookie:
          'user_preferences=eyJ0aGVtZSI6ImxpZ2h0IiwibGFuZ3VhZ2UiOiJlbiIsInRpbWV6b25lIjoiVVRDIiwibm90aWZpY2F0aW9ucyI6dHJ1ZX0%3D; feature_flags=eyJuZXdEYXNoYm9hcmQiOnRydWUsImJldGFGZWF0dXJlcyI6ZmFsc2UsImFkdmFuY2VkU2V0dGluZ3MiOnRydWUsImV4cGVyaW1lbnRhbFVJIjpmYWxzZX0%3D; tracking_consent=accepted; JSESSIONID=d2f6f4f6-3598-4c3a-ae47-77c00ce4d496; _csrf_token=ecc39304cf9817d340735d84c11764cc81d82fb28e7be78aa50d60d8eda790ba; analytics_id=analytics_8aafea501fd867cac2330669c04ffe8f; session_fingerprint=2312bf9954f60dc95f6545b4bd8148e1ede02b3fec26bd6de50dcb2b6b53321a; device_id=device_89a916333a71238896893c05',
      },
      body: null,
      method: 'POST',
    })
  ).json()

  await writeFile('users.json', JSON.stringify(usersList, null, 2))

  // Part 3 - get currently authenticated user's information.
  const apiTokens = await getApiTokens()

  const currentUser = await (
    await fetch('https://api.challenge.sunvoy.com/api/settings', {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: createEncodedPayload(apiTokens),
      method: 'POST',
    })
  ).json()
  console.log({ currentUser })
})().catch((e) => {
  console.error('Uncaught promise rejection', e)
  process.exit(1) // Maybe `throw new Error` is more semantic way to crash???
})
