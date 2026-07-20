// Talks to ProdHelperService's Translation/* endpoint through the same Azure
// Relay Hybrid Connection Auth/*, Equipment/* etc. use (see relayClient.js)
// — RelayListener.cs proxies Translation/* requests in-process to its own
// Kestrel-hosted TranslationController.
import { buildRelayRequestUrl } from '../relayClient'
import { AuthApiError } from '../auth/authClient'

async function request(path, { method = 'POST', body, accessToken } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const url = await buildRelayRequestUrl(path)
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let code = 'RequestFailed'
    let message = `Request failed with HTTP ${res.status}.`
    try {
      const errorBody = await res.json()
      if (errorBody.code) code = errorBody.code
      if (errorBody.message) message = errorBody.message
    } catch {
      // Non-JSON error body — keep the generic message above.
    }
    throw new AuthApiError(code, message, res.status)
  }

  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export function translateText(accessToken, { text, fromLanguageIsoCode, toLanguageIsoCode }) {
  return request('Translation/Translate', { body: { text, fromLanguageIsoCode, toLanguageIsoCode }, accessToken })
}
