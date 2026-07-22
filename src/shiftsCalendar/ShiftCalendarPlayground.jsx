import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import dragAndDropAddon from 'react-big-calendar/lib/addons/dragAndDrop'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import sv from 'date-fns/locale/sv'
import da from 'date-fns/locale/da'
import nb from 'date-fns/locale/nb'
import fi from 'date-fns/locale/fi'
import de from 'date-fns/locale/de'
import enGB from 'date-fns/locale/en-GB'
import fr from 'date-fns/locale/fr'
import it from 'date-fns/locale/it'
import es from 'date-fns/locale/es'
import pt from 'date-fns/locale/pt'
import el from 'date-fns/locale/el'
import pl from 'date-fns/locale/pl'
import cs from 'date-fns/locale/cs'
import sk from 'date-fns/locale/sk'
import hu from 'date-fns/locale/hu'
import bg from 'date-fns/locale/bg'
import hr from 'date-fns/locale/hr'
import sl from 'date-fns/locale/sl'
import lt from 'date-fns/locale/lt'
import lv from 'date-fns/locale/lv'
import et from 'date-fns/locale/et'
import sq from 'date-fns/locale/sq'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import ShiftCalendarEventModal, { DEFAULT_EVENT_COLOR } from './ShiftCalendarEventModal'
import { SUPPORTED_LANGUAGES } from '../i18n/languages'
import { useTimeFormat } from '../i18n/timeFormat'

const FALLBACK_LOCALE = 'en-GB'
const FALLBACK_CULTURE = 'en'

// Vite's dep pre-bundling double-wraps this deep CJS subpath's default export (yields
// { default: withDragAndDrop } instead of the function itself) - unwrap defensively either way.
const withDragAndDrop = typeof dragAndDropAddon === 'function' ? dragAndDropAddon : dragAndDropAddon.default

// Keyed by i18next language code (client/src/i18n/languages.js) rather than by date-fns locale
// name, since react-big-calendar's `culture` prop just needs to look up this map - it doesn't
// need to match date-fns's own naming.
const DATE_FNS_LOCALES = {
  sv,
  da,
  nb,
  fi,
  de,
  en: enGB,
  fr,
  it,
  es,
  'pt-PT': pt,
  el,
  pl,
  cs,
  sk,
  hu,
  bg,
  hr,
  // date-fns ships no Latin-script Serbian locale (only Cyrillic `sr`) - fall back to en-GB
  // rather than showing Cyrillic month names for a language the user picked in Latin script.
  'sr-Latn': enGB,
  sl,
  lt,
  lv,
  et,
  sq,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date, options) => startOfWeek(date, options),
  getDay,
  locales: DATE_FNS_LOCALES,
})

const DnDCalendar = withDragAndDrop(Calendar)

const ALL_VIEWS = [Views.MONTH, Views.WEEK, Views.WORK_WEEK, Views.DAY, Views.AGENDA]

// Fixed calendar behavior (previously exposed as togglable "settings" while trying the library
// out) - selectable so day-clicks still fire, multi-day times/drag-resize on, 30-minute steps.
const STEP_MINUTES = 30
const TIMESLOTS_PER_STEP = 2

function sampleEvents() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0)
  return [
    { id: 1, title: 'Morning shift', start, end, color: DEFAULT_EVENT_COLOR },
    {
      id: 2,
      title: 'Maintenance window',
      start: new Date(start.getTime() + 26 * 3600 * 1000),
      end: new Date(end.getTime() + 26 * 3600 * 1000),
      color: '#a94442',
    },
  ]
}

function eventPropGetter(event) {
  return { style: { backgroundColor: event.color || DEFAULT_EVENT_COLOR } }
}

function buildTimeFormats(hour12) {
  const timeToken = hour12 ? 'h:mm a' : 'HH:mm'
  const rangeFormat = ({ start, end }, culture, localizerArg) =>
    `${localizerArg.format(start, timeToken, culture)} – ${localizerArg.format(end, timeToken, culture)}`
  return {
    timeGutterFormat: hour12 ? 'h a' : 'HH:mm',
    eventTimeRangeFormat: rangeFormat,
    eventTimeRangeStartFormat: ({ start }, culture, localizerArg) => `${localizerArg.format(start, timeToken, culture)} – `,
    eventTimeRangeEndFormat: ({ end }, culture, localizerArg) => ` – ${localizerArg.format(end, timeToken, culture)}`,
    agendaTimeFormat: timeToken,
    agendaTimeRangeFormat: rangeFormat,
    selectRangeFormat: rangeFormat,
  }
}

// Local-only playground for trying out react-big-calendar - nothing here is persisted to the
// backend. Clicking a day/slot just marks that date (shown in the label above the calendar) - it
// doesn't create anything. Marking an existing event (click it) enables Edit/Delete for it; Edit
// opens ShiftCalendarEventModal so title/start/end/color are all editable.
//
// view/date/selected are deliberately controlled by this component (rather than left to
// react-big-calendar's own internal "uncontrollable" state via defaultView/defaultDate): under
// React 19 StrictMode that internal state never commits, so the toolbar's Month/Week/Day/etc.
// buttons (and event selection highlighting) silently do nothing. Controlling them ourselves
// sidesteps the bug entirely.
export default function ShiftCalendarPlayground({ equipmentName }) {
  const { t, i18n } = useTranslation()
  const [timeFormat, setTimeFormat] = useTimeFormat()
  const [events, setEvents] = useState(sampleEvents)
  const [view, setView] = useState(Views.WEEK)
  const [date, setDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)

  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? null

  function handleSelectSlot({ start }) {
    setSelectedDate(start)
  }

  function handleSelectEvent(event) {
    setSelectedEventId(event.id)
  }

  function openEdit() {
    if (!selectedEvent) return
    setEditingEvent(selectedEvent)
  }

  function handleDelete() {
    if (!selectedEvent) return
    if (!window.confirm(t('shiftsCalendar.deleteConfirmMessage', { title: selectedEvent.title }))) return
    setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id))
    setSelectedEventId(null)
  }

  function handleModalSave(fields) {
    setEvents((prev) => prev.map((e) => (e.id === editingEvent.id ? { ...e, ...fields } : e)))
    setEditingEvent(null)
  }

  function handleEventDrop({ event, start, end }) {
    setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, start, end } : e)))
  }

  function handleEventResize({ event, start, end }) {
    setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, start, end } : e)))
  }

  const dateLocale = SUPPORTED_LANGUAGES.find((lang) => lang.code === i18n.language)?.dateLocale ?? FALLBACK_LOCALE
  const formattedSelectedDate = selectedDate ? new Intl.DateTimeFormat(dateLocale, { dateStyle: 'short' }).format(selectedDate) : null
  const culture = DATE_FNS_LOCALES[i18n.language] ? i18n.language : FALLBACK_CULTURE

  const calendarMessages = useMemo(
    () => ({
      today: t('shiftsCalendar.calendar.messages.today'),
      previous: t('shiftsCalendar.calendar.messages.previous'),
      next: t('shiftsCalendar.calendar.messages.next'),
      month: t('shiftsCalendar.calendar.messages.month'),
      week: t('shiftsCalendar.calendar.messages.week'),
      work_week: t('shiftsCalendar.calendar.messages.work_week'),
      day: t('shiftsCalendar.calendar.messages.day'),
      agenda: t('shiftsCalendar.calendar.messages.agenda'),
      date: t('shiftsCalendar.calendar.messages.date'),
      time: t('shiftsCalendar.calendar.messages.time'),
      event: t('shiftsCalendar.calendar.messages.event'),
      allDay: t('shiftsCalendar.calendar.messages.allDay'),
      yesterday: t('shiftsCalendar.calendar.messages.yesterday'),
      tomorrow: t('shiftsCalendar.calendar.messages.tomorrow'),
      noEventsInRange: t('shiftsCalendar.calendar.messages.noEventsInRange'),
      showMore: (total) => t('shiftsCalendar.calendar.messages.showMore', { count: total }),
    }),
    [t],
  )

  const calendarFormats = useMemo(() => buildTimeFormats(timeFormat === '12h'), [timeFormat])

  return (
    <div>
      <p className="shift-calendar-selected-equipment">{t('shiftsCalendar.selectedEquipmentLabel')}: {equipmentName}</p>
      <p className="shift-calendar-selected-date">
        {formattedSelectedDate
          ? `${t('shiftsCalendar.selectedDateLabel')}: ${formattedSelectedDate}`
          : t('shiftsCalendar.noDateSelected')}
      </p>

      <div className="shift-calendar-actions">
        <span className="shift-calendar-selection-label">
          {selectedEvent ? t('shiftsCalendar.selectionMarkedLabel', { title: selectedEvent.title }) : t('shiftsCalendar.selectionNoneLabel')}
        </span>
        <button type="button" className="rbc-toolbar-button" onClick={openEdit} disabled={!selectedEvent}>
          {t('shiftsCalendar.editButton')}
        </button>
        <button type="button" className="rbc-toolbar-button" onClick={handleDelete} disabled={!selectedEvent}>
          {t('shiftsCalendar.deleteButton')}
        </button>

        <span className="shift-calendar-time-format" role="group" aria-label={t('shiftsCalendar.timeFormatSwitchLabel')}>
          <button
            type="button"
            className="rbc-toolbar-button"
            aria-pressed={timeFormat === '12h'}
            onClick={() => setTimeFormat('12h')}
          >
            12h
          </button>
          <button
            type="button"
            className="rbc-toolbar-button"
            aria-pressed={timeFormat === '24h'}
            onClick={() => setTimeFormat('24h')}
          >
            24h
          </button>
        </span>
      </div>

      <div style={{ height: 600, marginTop: '0.5rem' }}>
        <DnDCalendar
          localizer={localizer}
          culture={culture}
          messages={calendarMessages}
          formats={calendarFormats}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          selected={selectedEvent}
          views={ALL_VIEWS}
          selectable
          popup
          showMultiDayTimes
          step={STEP_MINUTES}
          timeslots={TIMESLOTS_PER_STEP}
          resizable
          eventPropGetter={eventPropGetter}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          style={{ height: '100%' }}
        />
      </div>

      {editingEvent && (
        <ShiftCalendarEventModal initial={editingEvent} onSave={handleModalSave} onCancel={() => setEditingEvent(null)} />
      )}
    </div>
  )
}
