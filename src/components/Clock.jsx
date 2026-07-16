import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '../i18n/languages'

const FALLBACK_LOCALE = 'en-GB'

export default function Clock() {
  const { i18n } = useTranslation()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const dateLocale = SUPPORTED_LANGUAGES.find((lang) => lang.code === i18n.language)?.dateLocale ?? FALLBACK_LOCALE
  const formatted = new Intl.DateTimeFormat(dateLocale, { dateStyle: 'short', timeStyle: 'medium' }).format(now)

  return <span className="footer-clock">{formatted}</span>
}
