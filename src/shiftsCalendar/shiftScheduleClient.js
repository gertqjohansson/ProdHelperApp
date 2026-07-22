// Talks to ProdHelperService's ShiftScheduleVersion/* endpoints through the same Azure Relay
// Hybrid Connection Equipment/* uses (see equipmentClient.js and relayClient.js).
import { buildRelayRequestUrl } from '../relayClient'
import { AuthApiError } from '../auth/authClient'

async function request(path, { method = 'POST', body, accessToken } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const url = await buildRelayRequestUrl(path)
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let code = 'RequestFailed'
    let message = `Request failed with HTTP ${res.status}.`
    try {
      const errorBody = await res.json()
      if (errorBody.code) code = errorBody.code
      if (errorBody.message) message = errorBody.message
    } catch {
      // Non-JSON error body — keep the generic message above.
    }
    throw new AuthApiError(code, message, res.status)
  }

  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export function createShiftScheduleVersion(accessToken, { equipmentId, startDate, daysInScedule }) {
  return request('ShiftScheduleVersion/Create', { body: { equipmentId, startDate, daysInScedule }, accessToken })
}

export function listEquipmentIdsWithSchedule(accessToken) {
  return request('ShiftScheduleVersion/ListEquipmentIdsWithSchedule', { accessToken })
}

export function getLatestShiftScheduleVersion(accessToken, equipmentId) {
  return request('ShiftScheduleVersion/GetLatestForEquipment', { body: { equipmentId }, accessToken })
}
