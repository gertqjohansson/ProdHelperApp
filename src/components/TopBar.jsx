import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageMenu from './LanguageMenu'
import MfaSetupModal from './MfaSetupModal'
import { useAuth } from '../auth/AuthContext'

// Only ever mounted while authenticated - App.jsx renders LoginPage instead
// of the rest of the app (including this component) until login succeeds.
export default function TopBar({ onPlannerSelected, onEquipmentsSelected, onAccountsPermissionsSelected, onArticlesSelected, onShiftsCalendarSelected }) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [navOpen, setNavOpen] = useState(false)
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [showMfaSetup, setShowMfaSetup] = useState(false)
  const navRef = useRef(null)
  const userRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setNavOpen(false)
        setAdminMenuOpen(false)
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false)
        setLangMenuOpen(false)
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setNavOpen(false)
        setAdminMenuOpen(false)
        setUserOpen(false)
        setLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function handlePlannerClick() {
    setNavOpen(false)
    setAdminMenuOpen(false)
    onPlannerSelected()
  }

  function toggleAdminMenu() {
    setAdminMenuOpen((open) => !open)
  }

  function handleEquipmentsClick() {
    setNavOpen(false)
    setAdminMenuOpen(false)
    onEquipmentsSelected()
  }

  function handleAccountsPermissionsClick() {
    setNavOpen(false)
    setAdminMenuOpen(false)
    onAccountsPermissionsSelected()
  }

  function handleArticlesClick() {
    setNavOpen(false)
    setAdminMenuOpen(false)
    onArticlesSelected()
  }

  function handleShiftsCalendarClick() {
    setNavOpen(false)
    setAdminMenuOpen(false)
    onShiftsCalendarSelected()
  }

  function toggleNav() {
    setUserOpen(false)
    setLangMenuOpen(false)
    setNavOpen((open) => {
      const next = !open
      if (!next) setAdminMenuOpen(false)
      return next
    })
  }

  function toggleUser() {
    setNavOpen(false)
    setUserOpen((open) => {
      const next = !open
      if (!next) setLangMenuOpen(false)
      return next
    })
  }

  function toggleLangMenu() {
    setLangMenuOpen((open) => !open)
  }

  function handleMfaSetupClick() {
    setUserOpen(false)
    setShowMfaSetup(true)
  }

  function handleLogoutClick() {
    setUserOpen(false)
    logout()
  }

  const userLabel = user.displayName ?? user.email

  return (
    <header className="topbar">
      <div className="topbar-section" ref={navRef}>
        <button
          type="button"
          className="topbar-trigger"
          aria-haspopup="menu"
          aria-expanded={navOpen}
          onClick={toggleNav}
        >
          <span className="hamburger-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="topbar-trigger-label">{t('nav.menuLabel')}</span>
        </button>
        {navOpen && (
          <ul className="topbar-dropdown" role="menu">
            <li role="none">
              <button type="button" role="menuitem" className="topbar-dropdown-item" onClick={handlePlannerClick}>
                {t('nav.planningLabel')}
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={adminMenuOpen}
                className="topbar-dropdown-item has-submenu"
                onClick={toggleAdminMenu}
              >
                <span>{t('nav.adminLabel')}</span>
                <span className={`topbar-dropdown-chevron${adminMenuOpen ? ' open' : ''}`} aria-hidden="true">
                  ›
                </span>
              </button>
              {adminMenuOpen && (
                <ul className="topbar-submenu" role="menu">
                  <li role="none">
                    <button type="button" role="menuitem" className="topbar-dropdown-item" onClick={handleEquipmentsClick}>
                      {t('nav.equipmentsLabel')}
                    </button>
                  </li>
                  <li role="none">
                    <button type="button" role="menuitem" className="topbar-dropdown-item" onClick={handleAccountsPermissionsClick}>
                      {t('nav.accountsPermissionsLabel')}
                    </button>
                  </li>
                  <li role="none">
                    <button type="button" role="menuitem" className="topbar-dropdown-item" onClick={handleArticlesClick}>
                      {t('nav.articlesLabel')}
                    </button>
                  </li>
                  <li role="none">
                    <button type="button" role="menuitem" className="topbar-dropdown-item" onClick={handleShiftsCalendarClick}>
                      {t('nav.shiftsCalendarLabel')}
                    </button>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        )}
      </div>

      <div className="topbar-section topbar-section-right" ref={userRef}>
        <button
          type="button"
          className="topbar-trigger"
          aria-haspopup="menu"
          aria-expanded={userOpen}
          onClick={toggleUser}
        >
          <span className="user-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.5h19.6v-2.5c0-3.3-6.5-4.9-9.8-4.9z" />
            </svg>
          </span>
          <span className="topbar-trigger-label">{userLabel}</span>
        </button>
        {userOpen && (
          <ul className="topbar-dropdown topbar-dropdown-right" role="menu">
            <li role="none">
              <button
                type="button"
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={langMenuOpen}
                className="topbar-dropdown-item has-submenu"
                onClick={toggleLangMenu}
              >
                <span>{t('language.selectorLabel')}</span>
                <span className={`topbar-dropdown-chevron${langMenuOpen ? ' open' : ''}`} aria-hidden="true">
                  ›
                </span>
              </button>
              {langMenuOpen && (
                <div className="topbar-submenu">
                  <LanguageMenu />
                </div>
              )}
            </li>

            <li role="none">
              <button type="button" role="menuitem" className="topbar-dropdown-item" onClick={handleMfaSetupClick}>
                {t('auth.mfaSetupTitle')}
              </button>
            </li>
            <li role="none">
              <button type="button" role="menuitem" className="topbar-dropdown-item" onClick={handleLogoutClick}>
                {t('auth.logoutButton')}
              </button>
            </li>
          </ul>
        )}
      </div>

      {showMfaSetup && <MfaSetupModal onClose={() => setShowMfaSetup(false)} />}
    </header>
  )
}
