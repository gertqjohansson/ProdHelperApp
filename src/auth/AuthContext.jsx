import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authClient from './authClient'

const STORAGE_KEY = 'prodhelper.auth'
const AuthContext = createContext(null)

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

function tokensToUser(tokens) {
  const claims = decodeJwt(tokens.accessToken)
  if (!claims) return null
  return {
    id: claims.sub,
    email: claims.email,
    displayName: claims.displayName ?? null,
    mfaEnabled: Array.isArray(claims.amr) ? claims.amr.includes('mfa') : claims.amr === 'mfa',
  }
}

function loadStoredTokens() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [tokens, setTokens] = useState(loadStoredTokens)
  const [isReady, setIsReady] = useState(false)
  const user = useMemo(() => (tokens ? tokensToUser(tokens) : null), [tokens])

  const persist = useCallback((newTokens) => {
    setTokens(newTokens)
    if (newTokens) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTokens))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // A stored token isn't necessarily still valid server-side (expired or
  // revoked) - confirm it with a silent refresh once at startup before
  // trusting it, rather than taking localStorage's word for it.
  useEffect(() => {
    let cancelled = false
    async function validateStoredSession() {
      if (!tokens) {
        setIsReady(true)
        return
      }
      try {
        const refreshed = await authClient.refresh(tokens.refreshToken)
        if (!cancelled) persist(refreshed)
      } catch {
        if (!cancelled) persist(null)
      } finally {
        if (!cancelled) setIsReady(true)
      }
    }
    validateStoredSession()
    return () => {
      cancelled = true
    }
    // Intentionally mount-only: validates whatever was in localStorage when
    // the provider first mounted, not a reactive dependency on `tokens`.
  }, [])

  const login = useCallback(async (email, password) => {
    const response = await authClient.login(email, password)
    if (response.mfaRequired) {
      return { mfaRequired: true, mfaToken: response.mfaToken }
    }
    persist(response.tokens)
    return { mfaRequired: false }
  }, [persist])

  const verifyMfa = useCallback(async (mfaToken, code) => {
    const tokenResponse = await authClient.verifyMfa(mfaToken, code)
    persist(tokenResponse)
  }, [persist])

  const forgotPassword = useCallback((email) => authClient.forgotPassword(email), [])

  const resetPassword = useCallback((email, token, newPassword) =>
    authClient.resetPassword(email, token, newPassword), [])

  const logout = useCallback(async () => {
    if (tokens) {
      try {
        await authClient.logout(tokens.refreshToken, tokens.accessToken)
      } catch {
        // Best-effort — still clear local state even if the server call fails.
      }
    }
    persist(null)
  }, [tokens, persist])

  // Attaches the access token to a Contracts.Auth call and retries once,
  // after a silent Auth/Refresh, if the access token turned out to be expired.
  const authFetch = useCallback(async (fn) => {
    if (!tokens) throw new authClient.AuthApiError('NotAuthenticated', 'Not logged in.')
    try {
      return await fn(tokens.accessToken)
    } catch (err) {
      if (!(err instanceof authClient.AuthApiError) || err.status !== 401) throw err
      const refreshed = await authClient.refresh(tokens.refreshToken)
      persist(refreshed)
      return fn(refreshed.accessToken)
    }
  }, [tokens, persist])

  // Forces a fresh access token (re-deriving the `amr` claim server-side) —
  // used after enabling/disabling MFA so `user.mfaEnabled` reflects the
  // change immediately instead of waiting for the next natural refresh.
  const refreshSession = useCallback(async () => {
    if (!tokens) return
    const refreshed = await authClient.refresh(tokens.refreshToken)
    persist(refreshed)
  }, [tokens, persist])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isReady,
      login,
      verifyMfa,
      forgotPassword,
      resetPassword,
      logout,
      authFetch,
      refreshSession,
    }),
    [user, isReady, login, verifyMfa, forgotPassword, resetPassword, logout, authFetch, refreshSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
