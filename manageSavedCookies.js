import { readFile, unlink, writeFile } from 'fs/promises'
import { z } from 'zod'

const savedCookiesSchema = z.object({
  cookiesString: z.string(),
  expiresUnixTimestamp: z.number(),
})

const COOKIE_HEADER_JSON_FILE_PATH = 'cookies-header.json'

export const saveCookies = async (
  /**
   * @type {{ cookiesString: string, expiresUnixTimestamp: number }}
   */
  { cookiesString, expiresUnixTimestamp }
) => {
  await writeFile(
    COOKIE_HEADER_JSON_FILE_PATH,
    JSON.stringify(
      savedCookiesSchema.parse({
        cookiesString,
        expiresUnixTimestamp,
      }),
      null,
      2
    )
  )
}

export const readSavedCookiesString = async () => {
  return readFile(COOKIE_HEADER_JSON_FILE_PATH)
    .then((savedCookiesJson) => {
      const savedCookies = savedCookiesSchema.parse(
        JSON.parse(savedCookiesJson.toString())
      )
      if (Date.now() < savedCookies.expiresUnixTimestamp) {
        return savedCookies.cookiesString
      } else {
        unlink(COOKIE_HEADER_JSON_FILE_PATH).catch((e) => {
          console.error(`Error deleting ${COOKIE_HEADER_JSON_FILE_PATH} !`, e)
        })
        return undefined
      }
    })
    .catch((e) => {
      // presumably the file does not exist. Just return undefined, same behavior as when cookie is expired.
      return undefined
    })
}
