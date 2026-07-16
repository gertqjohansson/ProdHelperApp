import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from './languages'

const STORAGE_KEY = 'prodhelper.lang'
const FALLBACK = 'en'

// One entry per locale file; Vite splits each into its own chunk so only the
// selected language is ever downloaded.
const localeLoaders = import.meta.glob('../locales/*.json')

function detectLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) return stored

  const browserLang = navigator.language?.split('-')[0]
  const match = SUPPORTED_LANGUAGES.find(
    (l) => l.code === browserLang || l.code.split('-')[0] === browserLang
  )
  return match ? match.code : FALLBACK
}

export async function initI18n() {
  const lng = detectLanguage()
  const loadLocale = localeLoaders[`../locales/${lng}.json`] ?? localeLoaders[`../locales/${FALLBACK}.json`]
  const resources = (await loadLocale()).default

  await i18next.use(initReactI18next).init({
    lng,
    fallbackLng: FALLBACK,
    resources: { [lng]: { translation: resources } },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })

  document.documentElement.lang = lng
  return lng
}

export function changeLanguage(code) {
  localStorage.setItem(STORAGE_KEY, code)
  window.location.reload()
}
