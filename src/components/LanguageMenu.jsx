import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '../i18n/languages'
import { changeLanguage } from '../i18n'

export default function LanguageMenu() {
  const { i18n } = useTranslation()
  const sorted = [...SUPPORTED_LANGUAGES].sort((a, b) => a.nativeName.localeCompare(b.nativeName))

  return (
    <div className="language-menu">
      <ul className="language-menu-list" role="menu">
        {sorted.map((lang) => (
          <li key={lang.code} role="none">
            <button
              type="button"
              role="menuitemradio"
              aria-checked={i18n.language === lang.code}
              className="language-menu-item"
              onClick={() => changeLanguage(lang.code)}
            >
              <img src={lang.flag} alt="" className="language-menu-flag" width="20" height="15" />
              <span>{lang.nativeName}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
