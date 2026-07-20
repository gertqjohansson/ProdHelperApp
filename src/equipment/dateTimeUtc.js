// Converts between the local values <input type="date">/<input type="datetime-local"> use and
// the UTC values the API sends/expects. Neither input type carries timezone info, and the server
// doesn't reliably preserve DateTime.Kind through a datetime2 column round-trip either - so a
// value coming back from the API may or may not have a trailing "Z". Every read helper below
// treats a missing offset as "this is UTC" explicitly, rather than relying on the JS Date
// constructor's default (which treats an offset-less date-time string as local, not UTC).

// <input type="date"> (YYYY-MM-DD) -> UTC ISO string for the API. A calendar date has no
// meaningful time-of-day, so no local-offset math is applied here - shifting by the browser's UTC
// offset could push the date onto the previous/next day. Sent as UTC midnight.
export function dateInputToUtcIso(dateInputValue) {
  return dateInputValue ? `${dateInputValue}T00:00:00.000Z` : null
}

// UTC ISO string from the API -> <input type="date"> value. Takes the date portion directly
// (no Date object, no timezone math) so it can never drift to the previous/next day.
export function utcIsoToDateInput(utcIsoValue) {
  return utcIsoValue ? String(utcIsoValue).slice(0, 10) : ''
}

// <input type="datetime-local"> (no timezone - the browser's local wall clock) -> UTC ISO string
// for the API.
export function localDateTimeInputToUtcIso(localValue) {
  if (!localValue) return null
  const date = new Date(localValue) // no Z/offset -> the JS engine parses this as local time
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

// UTC ISO string from the API -> <input type="datetime-local"> value in the browser's local time.
export function utcIsoToLocalDateTimeInput(utcIsoValue) {
  const date = parseUtc(utcIsoValue)
  if (!date) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// UTC ISO string from the API -> a JS Date, for anywhere a timestamp is displayed rather than fed
// into an <input> (e.g. via Intl.DateTimeFormat). Same "treat a missing offset as UTC" rule.
export function parseUtc(isoValue) {
  if (!isoValue) return null
  const hasOffset = /Z|[+-]\d{2}:\d{2}$/.test(isoValue)
  const date = new Date(hasOffset ? isoValue : `${isoValue}Z`)
  return Number.isNaN(date.getTime()) ? null : date
}
