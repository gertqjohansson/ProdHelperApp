// Talks to ProdHelperService's EquipmentCategory/* endpoints through the same
// Azure Relay Hybrid Connection Equipment/* uses (see equipmentClient.js).
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

export function listEquipmentCategories(accessToken, languageIsoCode) {
  return request('EquipmentCategory/List', { body: { languageIsoCode }, accessToken })
}

export function createEquipmentCategory(accessToken, { name, colorCode, languageIsoCode }) {
  return request('EquipmentCategory/Create', { body: { name, colorCode, languageIsoCode }, accessToken })
}

export function updateEquipmentCategory(accessToken, { id, name, colorCode, languageIsoCode }) {
  return request('EquipmentCategory/Update', { body: { id, name, colorCode, languageIsoCode }, accessToken })
}

export function deleteEquipmentCategory(accessToken, id) {
  return request('EquipmentCategory/Delete', { body: { id }, accessToken })
}
