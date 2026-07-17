import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { RelayError } from '../relayClient'
import { SUPPORTED_LANGUAGES } from '../i18n/languages'
import LanguageMenu from './LanguageMenu'
import loginBackground from '../assets/login-background.png'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const { login, verifyMfa, forgotPassword, resetPassword } = useAuth()

  function describeError(err) {
    return err instanceof RelayError ? t(err.i18nKey, err.i18nParams) : err.message
  }

  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const langRef = useRef(null)
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ?? SUPPORTED_LANGUAGES[0]

  useEffect(() => {
    function handleClickOutside(e) {
      if (langRef.current && !langRef.current.contains(e.target)) setLangMenuOpen(false)
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setLangMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const [step, setStep] = useState('login') // 'login' | 'mfa' | 'forgot' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaToken, setMfaToken] = useState(null)
  const [code, setCode] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)

  function resetMessages() {
    setError(null)
    setInfo(null)
  }

  async function handleLogin(e) {
    e.preventDefault()
    resetMessages()
    if (!EMAIL_PATTERN.test(email)) {
      setError(t('auth.emailInvalid'))
      return
    }
    setBusy(true)
    try {
      const result = await login(email, password)
      if (result.mfaRequired) {
        setMfaToken(result.mfaToken)
        setCode('')
        setStep('mfa')
      }
      // Else: AuthContext's isAuthenticated flips true after persist(), and
      // the App-level gate stops rendering this component on its own.
    } catch (err) {
      setError(describeError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleVerifyMfa(e) {
    e.preventDefault()
    resetMessages()
    setBusy(true)
    try {
      await verifyMfa(mfaToken, code)
      // AuthContext's isAuthenticated flips true after persist(), and the
      // App-level gate stops rendering this component on its own.
    } catch (err) {
      setError(describeError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    resetMessages()
    if (!EMAIL_PATTERN.test(email)) {
      setError(t('auth.emailInvalid'))
      return
    }
    setBusy(true)
    try {
      await forgotPassword(email)
      setResetCode('')
      setNewPassword('')
      setConfirmNewPassword('')
      setInfo(t('auth.forgotPasswordSuccess'))
      setStep('reset')
    } catch (err) {
      setError(describeError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    resetMessages()
    if (newPassword !== confirmNewPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setBusy(true)
    try {
      await resetPassword(email, resetCode, newPassword)
      setPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setResetCode('')
      setInfo(t('auth.resetPasswordSuccess'))
      setStep('login')
    } catch (err) {
      setError(describeError(err))
    } finally {
      setBusy(false)
    }
  }

  function switchTo(nextStep) {
    resetMessages()
    setStep(nextStep)
  }

  return (
    <div className="login-overlay" style={{ backgroundImage: `url(${loginBackground})` }}>
      <div className="login-language-selector" ref={langRef}>
        <button
          type="button"
          className="login-language-trigger"
          aria-haspopup="menu"
          aria-expanded={langMenuOpen}
          onClick={() => setLangMenuOpen((open) => !open)}
        >
          <img src={currentLang.flag} alt="" className="login-language-flag" width="20" height="15" />
          <span>{currentLang.nativeName}</span>
          <span className={`topbar-dropdown-chevron${langMenuOpen ? ' open' : ''}`} aria-hidden="true">
            ›
          </span>
        </button>
        {langMenuOpen && (
          <div className="topbar-dropdown login-language-dropdown">
            <LanguageMenu />
          </div>
        )}
      </div>

      <div className="login-card">
        {step === 'login' && (
          <form onSubmit={handleLogin}>
            <h2>{t('auth.loginTitle')}</h2>
            {info && <p className="login-info">{info}</p>}
            <label className="login-field">
              <span>{t('auth.emailLabel')}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
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
            <button type="submit" className="login-submit" disabled={busy}>
              {t('auth.loginButton')}
            </button>
            <p className="login-switch">
              <button type="button" onClick={() => switchTo('forgot')}>
                {t('auth.forgotPasswordLink')}
              </button>
            </p>
          </form>
        )}

        {step === 'mfa' && (
          <form onSubmit={handleVerifyMfa}>
            <h2>{t('auth.mfaTitle')}</h2>
            <p>{t('auth.mfaDescription')}</p>
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
            <button type="submit" className="login-submit" disabled={busy}>
              {t('auth.verifyButton')}
            </button>
          </form>
        )}

        {step === 'forgot' && (
          <form onSubmit={handleForgotPassword}>
            <h2>{t('auth.forgotPasswordTitle')}</h2>
            <p>{t('auth.forgotPasswordDescription')}</p>
            <label className="login-field">
              <span>{t('auth.emailLabel')}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                autoFocus
              />
            </label>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-submit" disabled={busy}>
              {t('auth.forgotPasswordButton')}
            </button>
            <p className="login-switch">
              <button type="button" onClick={() => switchTo('login')}>
                {t('auth.loginButton')}
              </button>
            </p>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword}>
            <h2>{t('auth.resetPasswordTitle')}</h2>
            <p>{t('auth.resetPasswordDescription')}</p>
            {info && <p className="login-info">{info}</p>}
            <label className="login-field">
              <span>{t('auth.emailLabel')}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label className="login-field">
              <span>{t('auth.resetCodeLabel')}</span>
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                autoComplete="one-time-code"
                required
                autoFocus
              />
            </label>
            <label className="login-field">
              <span>{t('auth.newPasswordLabel')}</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
            <label className="login-field">
              <span>{t('auth.confirmNewPasswordLabel')}</span>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-submit" disabled={busy}>
              {t('auth.resetPasswordButton')}
            </button>
            <p className="login-switch">
              <button type="button" onClick={() => switchTo('login')}>
                {t('auth.loginButton')}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
