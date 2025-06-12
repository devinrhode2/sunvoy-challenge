import { JSDOM } from 'jsdom'
import { z } from 'zod'

export const getApiTokens = async () => {
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

  // NOTE: there is probably a better dom parsing lib which has solid TS support..
  /** @type {Record<string, string>} */
  const apiTokensRaw = {}
  hiddenInputNodes.forEach((/** @type {unknown} */ nodeRaw) => {
    const node = z
      .object({
        id: z.string(),
        value: z.string(),
      })
      .parse(nodeRaw)
    apiTokensRaw[node.id] = node.value
  })

  const apiTokensSchema = z.object({
    access_token: z.string(),
    openId: z.string(),
    userId: z.string(),
    apiuser: z.string(),
    operateId: z.string(),
    language: z.string(),
  })

  return apiTokensSchema.parse(apiTokensRaw)
}
