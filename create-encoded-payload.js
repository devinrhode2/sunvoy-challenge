import { createHmac } from 'node:crypto'

export const createEncodedPayload = (
  /** @type {Record<string, string>} */
  apiTokens
) => {
  const timestamp = Math.floor(Date.now() / 1e3).toString()

  const finalPayload = {
    ...apiTokens,
    timestamp,
  }

  const basePayload = Object.keys(finalPayload)
    .sort()
    .map(
      (key) =>
        `${key}=${encodeURIComponent(
          // @ts-expect-error - not really worth solving..
          finalPayload[key]
        )}`
    )
    .join('&')

  const encrypter = createHmac('sha1', 'mys3cr3t')
  encrypter.update(basePayload)

  const checkcode = encrypter.digest('hex').toUpperCase()

  return `${basePayload}&checkcode=${checkcode}`
}
