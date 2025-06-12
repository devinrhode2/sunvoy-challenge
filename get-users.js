import { writeFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
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

  // 3.1 Get api tokens:
  const tokensPageHtml = await (
    await fetch('https://challenge.sunvoy.com/settings/tokens', {
      headers: {
        cookie:
          'JSESSIONID=91e5c170-a785-4809-b5dd-51cf1f9c4fa2; _csrf_token=2a09507ba1779eaf7f5c966b41b13a9b7675b6adfe9cb193126eb919e4a5b278; user_preferences=eyJ0aGVtZSI6ImxpZ2h0IiwibGFuZ3VhZ2UiOiJlbiIsInRpbWV6b25lIjoiVVRDIiwibm90aWZpY2F0aW9ucyI6dHJ1ZX0%3D; analytics_id=analytics_30827bb9a2a73d8fb7417cdabeac9559; session_fingerprint=282f267b9f9344f45da90c3620b80fb5db8f4c8238973fadf42fcfcad2ace657; feature_flags=eyJuZXdEYXNoYm9hcmQiOnRydWUsImJldGFGZWF0dXJlcyI6ZmFsc2UsImFkdmFuY2VkU2V0dGluZ3MiOnRydWUsImV4cGVyaW1lbnRhbFVJIjpmYWxzZX0%3D; tracking_consent=accepted; device_id=device_3300ee6bc47fb77796835bea',
      },
      body: null,
      method: 'GET',
    })
  ).text()

  const tokensPageDom = new JSDOM(tokensPageHtml)
  // Inspired by the source code on /settings page
  const hiddenInputNodes = tokensPageDom.window.document.querySelectorAll(
    'input[type="hidden"]'
  )

  const payload = {}
  hiddenInputNodes.forEach((node) => {
    payload[node.id] = node.value
  })
  console.log({ payload })
})().catch((e) => {
  console.error('Uncaught promise rejection', e)
  process.exit(1) // Maybe `throw new Error` is more semantic way to crash???
})
