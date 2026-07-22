import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '../i18n/languages'
import { useTimeFormat } from '../i18n/timeFormat'

const FALLBACK_LOCALE = 'en-GB'

export default function Clock() {
  const { i18n } = useTranslation()
  const [timeFormat] = useTimeFormat()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const dateLocale = SUPPORTED_LANGUAGES.find((lang) => lang.code === i18n.language)?.dateLocale ?? FALLBACK_LOCALE
  // `dateStyle`/`timeStyle` can't be combined with an explicit `hour12` override per the
  // Intl.DateTimeFormat spec, so spell out the fields instead to honor the shared preference.
  const formatted = new Intl.DateTimeFormat(dateLocale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: timeFormat === '12h',
  }).format(now)

  return <span className="footer-clock">{formatted}</span>
}
