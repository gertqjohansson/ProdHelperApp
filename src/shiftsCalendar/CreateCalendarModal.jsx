import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import addDays from 'date-fns/addDays'
import format from 'date-fns/format'
import { SUPPORTED_LANGUAGES } from '../i18n/languages'

const FALLBACK_LOCALE = 'en-GB'
const NUMBER_OF_DAYS_OPTIONS = [7, 14, 21, 35, 42, 50]

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

// equipmentName - shown in the modal title. previousStartDate - ISO date(-time) string of the
// equipment's latest existing ShiftScheduleVersion, or null if it has none. onSave({ startDate,
// daysInScedule }) - startDate is a 'yyyy-MM-dd' string straight from the date input; must resolve
// on success (the caller closes this modal) or throw an Error whose message is already a
// user-facing translated string.
export default function CreateCalendarModal({ equipmentName, previousStartDate, onSave, onCancel }) {
  const { t, i18n } = useTranslation()
  const [startDate, setStartDate] = useState('')
  const [daysInScedule, setDaysInScedule] = useState(NUMBER_OF_DAYS_OPTIONS[0])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  // A new calendar must start after today, and (if the equipment already has one) at least 7 days
  // after the previous calendar's start date - mirrors ShiftScheduleVersionController.Create's
  // StartDateMustBeFuture/StartDateTooSoonAfterPrevious checks so the user gets immediate feedback
  // instead of a round trip to the server.
  const tomorrow = addDays(startOfToday(), 1)
  const minDate = previousStartDate && addDays(new Date(previousStartDate), 7) > tomorrow
    ? addDays(new Date(previousStartDate), 7)
    : tomorrow
  const minStartDate = format(minDate, 'yyyy-MM-dd')
  const dateLocale = SUPPORTED_LANGUAGES.find((lang) => lang.code === i18n.language)?.dateLocale ?? FALLBACK_LOCALE
  const formattedMinDate = new Intl.DateTimeFormat(dateLocale, { dateStyle: 'short' }).format(minDate)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await onSave({ startDate, daysInScedule: Number(daysInScedule) })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <h2>{t('shiftsCalendar.createCalendarModalTitle', { name: equipmentName })}</h2>
          <label className="login-field">
            <span>{t('shiftsCalendar.startDateLabel')}</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={minStartDate}
              autoFocus
              required
            />
            <p className="login-field-hint">{t('shiftsCalendar.startDateMinHint', { date: formattedMinDate })}</p>
          </label>
          <label className="login-field">
            <span>{t('shiftsCalendar.numberOfDaysLabel')}</span>
            <select value={daysInScedule} onChange={(e) => setDaysInScedule(e.target.value)}>
              {NUMBER_OF_DAYS_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {days}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="login-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onCancel} disabled={busy}>
              {t('equipment.cancelButton')}
            </button>
            <button type="submit" className="login-submit" disabled={busy || !startDate || startDate < minStartDate}>
              {t('equipment.saveButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
