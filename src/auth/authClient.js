// Talks to ProdHelperService's Auth/* endpoints through the same Azure Relay
// Hybrid Connection Try1/Try2 use (see relayClient.js) — RelayListener.cs
// proxies Auth/* requests in-process to its own Kestrel-hosted AuthController.
// The AdminApp is unaffected: it still targets the local Kestrel API directly
// (see ProdHelperService.AdminApp/Program.cs).
import { buildRelayRequestUrl } from '../relayClient'

export class AuthApiError extends Error {
  constructor(code, message, status) {
    super(message)
    this.code = code
    this.status = status
  }
}

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
      // Non-JSON error body (e.g. a bare 401 from [Authorize] with no
      // controller code involved) — keep the generic message above.
    }
    throw new AuthApiError(code, message, res.status)
  }

  // Some endpoints return 200 with no body at all (e.g. Logout,
  // DisableAuthenticator, ForgotPassword) rather than 204 - guard on actual
  // content instead of assuming any non-204 success has a JSON body.
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export function login(email, password) {
  return request('Auth/Login', { body: { email, password } })
}

export function forgotPassword(email) {
  return request('Auth/ForgotPassword', { body: { email } })
}

export function resetPassword(email, token, newPassword) {
  return request('Auth/ResetPassword', { body: { email, token, newPassword } })
}

export function verifyMfa(mfaToken, code) {
  return request('Auth/VerifyMfa', { body: { mfaToken, code } })
}

export function refresh(refreshToken) {
  return request('Auth/Refresh', { body: { refreshToken } })
}

export function logout(refreshToken, accessToken) {
  return request('Auth/Logout', { body: { refreshToken }, accessToken })
}

export function setupAuthenticator(accessToken) {
  return request('Auth/Mfa/Authenticator/Setup', { accessToken })
}

export function enableAuthenticator(accessToken, code) {
  return request('Auth/Mfa/Authenticator/Enable', { body: { code }, accessToken })
}

export function disableAuthenticator(accessToken, password) {
  return request('Auth/Mfa/Authenticator/Disable', { body: { password }, accessToken })
}
