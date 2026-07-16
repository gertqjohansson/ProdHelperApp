import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageMenu from './LanguageMenu'

export default function TopBar({ onPlannerSelected }) {
  const { t } = useTranslation()
  const [navOpen, setNavOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const navRef = useRef(null)
  const userRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) setNavOpen(false)
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false)
        setLangMenuOpen(false)
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setNavOpen(false)
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
    onPlannerSelected()
  }

  function toggleNav() {
    setUserOpen(false)
    setLangMenuOpen(false)
    setNavOpen((open) => !open)
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
                Planner
              </button>
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
          <span className="topbar-trigger-label">{t('nav.guestLabel')}</span>
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
          </ul>
        )}
      </div>
    </header>
  )
}
