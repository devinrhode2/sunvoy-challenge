import { writeFile } from 'node:fs/promises'
import { z } from 'zod'
import { getApiTokens } from './get-api-tokens.js'
import { createEncodedPayload } from './create-encoded-payload.js'
import { getCookieHeader } from './getCookieHeader.js'
;(async () => {
  const cookieHeader = await getCookieHeader()

  const userSchema = z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  })
  const usersListSchema = z.array(userSchema)

  const usersListRaw = await (
    await fetch('https://challenge.sunvoy.com/api/users', {
      headers: {
        cookie: cookieHeader,
      },
      body: null,
      method: 'POST',
    })
  ).json()

  await writeFile('users.json', JSON.stringify(usersListRaw, null, 2))

  console.log('wrote users.json')

  if (!Array.isArray(usersListRaw)) {
    throw new Error(
      'usersList is not an array. Code should be updated so we can .push current user to end.'
    )
  }
  const usersList = usersListSchema.parse(usersListRaw)

  // Part 3 - get currently authenticated user's information.
  const apiTokens = await getApiTokens()

  const currentUserRaw = await (
    await fetch('https://api.challenge.sunvoy.com/api/settings', {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: createEncodedPayload(apiTokens),
      method: 'POST',
    })
  ).json()

  if (userSchema.safeParse(currentUserRaw).error) {
    // This could also be a throw statement or unit test, depending on downstream QA/testing processes.
    console.error(
      'current user does not adhere to expected userSchema. This may cause parsing errors for other code consuming users.json!'
    )
  }

  usersList.push(currentUserRaw)

  await writeFile('users.json', JSON.stringify(usersList, null, 2))
})().catch((e) => {
  console.error('Uncaught promise rejection', e)
  process.exit(1) // Maybe `throw new Error` is more semantic way to crash???
})
