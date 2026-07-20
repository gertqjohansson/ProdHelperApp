// Talks to ProdHelperService's EquipmentLog/* endpoints through the same Azure Relay Hybrid
// Connection Auth/*, Equipment/*, EquipmentUpload/*, EquipmentLink/* etc. use (see relayClient.js).
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

export function listEquipmentLogs(accessToken, equipmentId) {
  return request('EquipmentLog/List', { body: { equipmentId }, accessToken })
}

export function createEquipmentLog(accessToken, { equipmentId, nickname, logText, dateTimeUtc }) {
  return request('EquipmentLog/Create', { body: { equipmentId, nickname, logText, dateTimeUtc }, accessToken })
}

export function updateEquipmentLog(accessToken, { id, nickname, logText, dateTimeUtc }) {
  return request('EquipmentLog/Update', { body: { id, nickname, logText, dateTimeUtc }, accessToken })
}

export function deleteEquipmentLog(accessToken, id) {
  return request('EquipmentLog/Delete', { body: { id }, accessToken })
}

const ERROR_CODE_KEYS = {
  NicknameRequired: 'equipmentLog.nicknameRequired',
  LogTextRequired: 'equipmentLog.logTextRequired',
  DateTimeRequired: 'equipmentLog.dateTimeRequired',
  EquipmentNotFound: 'equipmentLog.equipmentNotFound',
  NotFound: 'equipmentLog.notFound',
}

export function describeLogError(err, t) {
  const key = ERROR_CODE_KEYS[err.code]
  return key ? t(key) : err.message
}
