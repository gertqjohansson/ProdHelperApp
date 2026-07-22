import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from './languages'

const FALLBACK_LOCALE = 'en-GB'
const STORAGE_KEY = 'prodhelper.timeFormat'
const CHANGE_EVENT = 'prodhelper:timeformat-change'

export function getStoredTimeFormat() {
  const value = localStorage.getItem(STORAGE_KEY)
  return value === '12h' || value === '24h' ? value : null
}

export function setTimeFormat(value) {
  localStorage.setItem(STORAGE_KEY, value)
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: value }))
}

// Follows the same convention Intl already applies for `dateLocale` elsewhere in the app
// (e.g. en-US-style locales default to 12h, most European locales default to 24h).
export function autoTimeFormatFor(dateLocale) {
  const { hour12 } = new Intl.DateTimeFormat(dateLocale, { hour: 'numeric' }).resolvedOptions()
  return hour12 ? '12h' : '24h'
}

// i18next emits its own change events, but this preference isn't part of i18next state, so it
// needs its own same-tab event (the native `storage` event only fires in *other* tabs).
export function useTimeFormat() {
  const { i18n } = useTranslation()
  const [stored, setStored] = useState(getStoredTimeFormat)

  useEffect(() => {
    function handleChange() {
      setStored(getStoredTimeFormat())
    }
    function handleStorage(event) {
      if (event.key === STORAGE_KEY) handleChange()
    }
    window.addEventListener(CHANGE_EVENT, handleChange)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(CHANGE_EVENT, handleChange)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const dateLocale = SUPPORTED_LANGUAGES.find((lang) => lang.code === i18n.language)?.dateLocale ?? FALLBACK_LOCALE
  const timeFormat = stored ?? autoTimeFormatFor(dateLocale)

  return [timeFormat, setTimeFormat]
}
