import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import * as authClient from '../auth/authClient'

export default function MfaSetupModal({ onClose }) {
  const { t } = useTranslation()
  const { user, authFetch, refreshSession } = useAuth()

  const [setupInfo, setSetupInfo] = useState(null)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(!user.mfaEnabled)

  useEffect(() => {
    if (user.mfaEnabled) return
    let cancelled = false
    authFetch((token) => authClient.setupAuthenticator(token))
      .then((info) => {
        if (!cancelled) setSetupInfo(info)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user.mfaEnabled, authFetch])

  async function handleEnable(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const result = await authFetch((token) => authClient.enableAuthenticator(token, code))
      setRecoveryCodes(result.recoveryCodes)
      await refreshSession()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDisable(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await authFetch((token) => authClient.disableAuthenticator(token, password))
      await refreshSession()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal mfa-setup-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2>{t('auth.mfaSetupTitle')}</h2>

        {user.mfaEnabled ? (
          recoveryCodes ? (
            <RecoveryCodesView codes={recoveryCodes} onClose={onClose} t={t} />
          ) : (
            <form onSubmit={handleDisable}>
              <p>{t('auth.mfaAlreadyEnabled')}</p>
              <label className="login-field">
                <span>{t('auth.passwordLabel')}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              {error && <p className="login-error">{error}</p>}
              <div className="modal-actions">
                <button type="submit" className="login-submit" disabled={busy}>
                  {t('auth.mfaDisableButton')}
                </button>
              </div>
            </form>
          )
        ) : recoveryCodes ? (
          <RecoveryCodesView codes={recoveryCodes} onClose={onClose} t={t} />
        ) : loading ? (
          <p>{t('status.sending')}</p>
        ) : setupInfo ? (
          <form onSubmit={handleEnable}>
            <p>{t('auth.mfaSetupDescription')}</p>
            {setupInfo.qrCodePngBase64 && (
              <img
                className="mfa-qr"
                src={`data:image/png;base64,${setupInfo.qrCodePngBase64}`}
                alt={t('auth.mfaSetupTitle')}
              />
            )}
            <p className="mfa-shared-key">{setupInfo.sharedKey}</p>
            <label className="login-field">
              <span>{t('auth.mfaCodeLabel')}</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
                required
                autoFocus
              />
            </label>
            {error && <p className="login-error">{error}</p>}
            <div className="modal-actions">
              <button type="submit" className="login-submit" disabled={busy}>
                {t('auth.mfaEnableButton')}
              </button>
            </div>
          </form>
        ) : (
          error && <p className="login-error">{error}</p>
        )}

        {!recoveryCodes && (
          <div className="modal-actions">
            <button type="button" className="modal-ok" onClick={onClose}>
              {t('auth.close')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function RecoveryCodesView({ codes, onClose, t }) {
  return (
    <div>
      <p>{t('auth.mfaRecoveryCodesDescription')}</p>
      <ul className="mfa-recovery-codes">
        {codes.map((rc) => (
          <li key={rc}>{rc}</li>
        ))}
      </ul>
      <div className="modal-actions">
        <button type="button" className="modal-ok" onClick={onClose}>
          {t('auth.close')}
        </button>
      </div>
    </div>
  )
}
