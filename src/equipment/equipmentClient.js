// Talks to ProdHelperService's Equipment/* endpoints through the same Azure
// Relay Hybrid Connection Auth/* uses (see relayClient.js and authClient.js)
// — RelayListener.cs proxies Equipment/* requests in-process to its own
// Kestrel-hosted EquipmentController.
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

export function listEquipment(accessToken, languageIsoCode) {
  return request('Equipment/List', { body: { languageIsoCode }, accessToken })
}

export function createEquipment(
  accessToken,
  {
    parentId,
    name,
    externalCode,
    isOee,
    isPlannable,
    colorCode,
    equipmentCategoryId,
    languageIsoCode,
    useEconomy,
    dateOfPurchase,
    price,
    depreciationPeriod,
    useNotification,
    notificationDate,
    notification,
  }
) {
  return request('Equipment/Create', {
    body: {
      parentId,
      name,
      externalCode,
      isOee,
      isPlannable,
      colorCode,
      equipmentCategoryId,
      languageIsoCode,
      useEconomy,
      dateOfPurchase,
      price,
      depreciationPeriod,
      useNotification,
      notificationDate,
      notification,
    },
    accessToken,
  })
}

export function updateEquipment(
  accessToken,
  {
    id,
    parentId,
    name,
    externalCode,
    isOee,
    isPlannable,
    colorCode,
    equipmentCategoryId,
    languageIsoCode,
    useEconomy,
    dateOfPurchase,
    price,
    depreciationPeriod,
    useNotification,
    notificationDate,
    notification,
  }
) {
  return request('Equipment/Update', {
    body: {
      id,
      parentId,
      name,
      externalCode,
      isOee,
      isPlannable,
      colorCode,
      equipmentCategoryId,
      languageIsoCode,
      useEconomy,
      dateOfPurchase,
      price,
      depreciationPeriod,
      useNotification,
      notificationDate,
      notification,
    },
    accessToken,
  })
}

export function deleteEquipment(accessToken, id) {
  return request('Equipment/Delete', { body: { id }, accessToken })
}
