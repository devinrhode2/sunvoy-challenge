import { JSDOM } from 'jsdom'
import { readFile } from 'node:fs/promises'
import { z } from 'zod'
import axios from 'axios'

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
  const loginResponse = await fetch('https://challenge.sunvoy.com/login', {
    headers: {
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'en,en-US;q=0.9,zh-CN;q=0.8,zh;q=0.7',
      'cache-control': 'max-age=0',
      'content-type': 'application/x-www-form-urlencoded',
      priority: 'u=0, i',
      'sec-ch-ua':
        '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      Referer: 'https://challenge.sunvoy.com/login',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
    body: new URLSearchParams({
      nonce,
      ...credentials,
    }).toString(),
    method: 'POST',
  })

  fetch('https://challenge.sunvoy.com/login', {
    credentials: 'include',
    headers: {
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'cache-control': 'max-age=0',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      nonce,
      ...credentials,
    }),
    method: 'POST',
  })
  loginResponse.headers.forEach((key, value) => {
    console.log({ key, value })
  })
  const setCookieHeaders = loginResponse.headers.getSetCookie()
  console.log({ setCookieHeaders })

  const lowestMaxAge = setCookieHeaders
    .map((setCookieHeaderValue) => {
      const cookieFlags = Object.fromEntries(
        // This cookie parsing code is audacious, and probably fails in some unknown circumstances. A 3rd-party library may be advised if we run into issues.
        // (In the context of this exercise, I am avoiding copy/pasting code from online or just using a lib here.)
        setCookieHeaderValue.split(';').map((cookieFlag) => {
          return cookieFlag.toLowerCase().split('=')
        })
      )
      return parseInt(cookieFlags['max-age'], 10)
    })
    .sort()

  console.log({ lowestMaxAge })

  // TODO: save valid cookiesString to cookie-header.json
  // loginResponse

  return ''
}
