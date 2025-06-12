import { JSDOM } from 'jsdom'

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

  return nonceNode?.getAttribute('value')
}

export const getCookieHeader = async () => {
  // TODO: Add an initial check to see if if cookie-header.json has an un-expired cookie string.

  const nonce = await getNonce()

  fetch('https://challenge.sunvoy.com/login', {
    headers: {
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'cache-control': 'max-age=0',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: 'nonce=7dcd57c35a93eee4a383360ea6c99cbd&username=demo%40example.org&password=test',
    method: 'POST',
  })

  // user_preferences: 'eyJ0aGVtZSI6ImxpZ2h0IiwibGFuZ3VhZ2UiOiJlbiIsInRpbWV6b25lIjoiVVRDIiwibm90aWZpY2F0aW9ucyI6dHJ1ZX0%3D',
  // feature_flags: 'eyJuZXdEYXNoYm9hcmQiOnRydWUsImJldGFGZWF0dXJlcyI6ZmFsc2UsImFkdmFuY2VkU2V0dGluZ3MiOnRydWUsImV4cGVyaW1lbnRhbFVJIjpmYWxzZX0%3D',
  // tracking_consent: 'accepted',
  // JSESSIONID: 'd2f6f4f6-3598-4c3a-ae47-77c00ce4d496',
  // _csrf_token: 'ecc39304cf9817d340735d84c11764cc81d82fb28e7be78aa50d60d8eda790ba',
  // analytics_id: 'analytics_8aafea501fd867cac2330669c04ffe8f',
  // session_fingerprint: '2312bf9954f60dc95f6545b4bd8148e1ede02b3fec26bd6de50dcb2b6b53321a',
  // device_id: 'device_89a916333a71238896893c05'
  return ''
}
