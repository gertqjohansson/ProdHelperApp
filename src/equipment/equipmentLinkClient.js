// Talks to ProdHelperService's EquipmentLink/* endpoints through the same Azure Relay Hybrid
// Connection Auth/*, Equipment/*, EquipmentUpload/* etc. use (see relayClient.js).
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

export function listEquipmentLinks(accessToken, equipmentId) {
  return request('EquipmentLink/List', { body: { equipmentId }, accessToken })
}

export function createEquipmentLink(accessToken, { equipmentId, nickname, path, isDocument, actionTimeUtc, madeByUser }) {
  return request('EquipmentLink/Create', {
    body: { equipmentId, nickname, path, isDocument, actionTimeUtc, madeByUser },
    accessToken,
  })
}

export function deleteEquipmentLink(accessToken, { id, actionTimeUtc, madeByUser }) {
  return request('EquipmentLink/Delete', { body: { id, actionTimeUtc, madeByUser }, accessToken })
}

const ERROR_CODE_KEYS = {
  NicknameRequired: 'equipmentLink.nicknameRequired',
  PathInvalid: 'equipmentLink.pathInvalid',
  EquipmentNotFound: 'equipmentLink.equipmentNotFound',
  NotFound: 'equipmentLink.notFound',
  DateTimeRequired: 'equipmentLink.dateTimeRequired',
  MadeByUserRequired: 'equipmentLink.madeByUserRequired',
}

export function describeLinkError(err, t) {
  const key = ERROR_CODE_KEYS[err.code]
  return key ? t(key) : err.message
}
