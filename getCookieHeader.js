import { JSDOM } from 'jsdom'
import { readFile, writeFile } from 'node:fs/promises'
import { z } from 'zod'
import { execSync } from 'node:child_process'

const getNonce = async () => {
  const loginPageHtml = await (
    await fetch('https://challenge.sunvoy.com/login', {
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      },
      body: null,
      method: 'GET',
    })
  ).text()

  const loginPageDom = new JSDOM(loginPageHtml)
  const nonceNode = loginPageDom.window.document.querySelector('[name="nonce"]')

  const nonce = nonceNode?.getAttribute('value')

  if (!nonce) {
    console.error('cant find nonce, attempting to use empty string instead')
    return ''
  }

  return nonce
}

export const getCookieHeader = async () => {
  // TODO: Add an initial check to see if if cookie-header.json has an un-expired cookie string.

  const nonce = await getNonce()

  // In the isolated context of this challenge, getting the credentials with a static import statement seems preferable in style in performance.
  // This approach is more amenable to further changes, where the credentials.json could change throughout the course of running this script.
  const credentialsSchema = z.object({
    username: z.string(),
    password: z.string(),
  })
  const creds = (await readFile('credentials.json')).toString()
  const credentials = credentialsSchema.parse(JSON.parse(creds))

  // POST request to login
  const payload = new URLSearchParams({
    nonce,
    ...credentials,
  }).toString()

  const loginResponse = execSync(
    `curl -i 'https://challenge.sunvoy.com/login' \
  -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7' \
  -H 'accept-language: en,en-US;q=0.9,zh-CN;q=0.8,zh;q=0.7' \
  -H 'cache-control: max-age=0' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -H 'origin: https://challenge.sunvoy.com' \
  -H 'priority: u=0, i' \
  -H 'referer: https://challenge.sunvoy.com/login' \
  -H 'sec-ch-ua: "Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: document' \
  -H 'sec-fetch-mode: navigate' \
  -H 'sec-fetch-site: same-origin' \
  -H 'sec-fetch-user: ?1' \
  -H 'upgrade-insecure-requests: 1' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36' \
  --data-raw '${payload}'`
  ).toString()
  const setCookieHeaders = loginResponse
    .split('\n')
    .filter((line) => line.startsWith('set-cookie: '))
    .map((line) => line.replace('set-cookie: ', ''))

  const cookieFlagEntriesList = setCookieHeaders.map((setCookieHeaderValue) => {
    // This cookie parsing code is audacious, and probably fails in some unknown circumstances. A 3rd-party library may be advised if we run into issues.
    // (In the context of this exercise, I am avoiding copy/pasting code from online or just using a lib here.)
    return setCookieHeaderValue
      .split('; ')
      .map((rawCookieFlagString, index) => {
        const [key, value] = rawCookieFlagString.split('=')
        return [
          // Preserve casing on cookie NAME.
          index !== 0 ? key?.toLowerCase() : key,
          value,
        ]
      })
  })

  /** This cookie is considered expired in `lowestMaxAge` seconds. */
  const lowestMaxAgeRaw = cookieFlagEntriesList
    .map((cookieFlagEntries) => {
      return parseInt(Object.fromEntries(cookieFlagEntries)['max-age'], 10)
    })
    .sort()
    .pop()

  if (!lowestMaxAgeRaw && lowestMaxAgeRaw !== 0) {
    console.error(
      'lowestMaxAge is a non-zero falsey value! Defaulting to 0 (always fetch fresh cookies)',
      {
        lowestMaxAgeRaw,
      }
    )
  }
  const lowestMaxAge = lowestMaxAgeRaw || 0

  const cookiesString = cookieFlagEntriesList
    .map((cookieFlagEntries) => {
      return cookieFlagEntries.shift()?.join('=')
    })
    .join('; ')

  await writeFile(
    'cookies-header.json',
    JSON.stringify(
      {
        cookiesString,
        expiresUnixTimestamp: Date.now() + lowestMaxAge * 1000,
      },
      null,
      2
    )
  )

  console.log({ cookiesString })

  return cookiesString
}
