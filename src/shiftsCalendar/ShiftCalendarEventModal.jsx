import { useState } from 'react'

export const DEFAULT_EVENT_COLOR = '#3174ad'

function pad(n) {
  return String(n).padStart(2, '0')
}

function toDatetimeLocalValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// initial - { title, start, end, color } of the event being edited, to prefill the form.
// onSave({ title, start, end, color }) - start/end are Date objects.
export default function ShiftCalendarEventModal({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial.title ?? '')
  const [start, setStart] = useState(toDatetimeLocalValue(initial.start))
  const [end, setEnd] = useState(toDatetimeLocalValue(initial.end))
  const [color, setColor] = useState(initial.color ?? DEFAULT_EVENT_COLOR)
  const [error, setError] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    const startDate = new Date(start)
    const endDate = new Date(end)
    if (!(endDate > startDate)) {
      setError('End must be after start.')
      return
    }
    onSave({ title: title.trim(), start: startDate, end: endDate, color })
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <h2>Edit event</h2>
          <label className="login-field">
            <span>Title</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </label>
          <label className="login-field">
            <span>Start</span>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label className="login-field">
            <span>End</span>
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
          <label className="login-field">
            <span>Color</span>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </label>

          {error && <p className="login-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="login-submit">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
