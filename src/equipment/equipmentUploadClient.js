// Talks to ProdHelperService's EquipmentUpload/* endpoints through the same Azure Relay Hybrid
// Connection Auth/*, Equipment/* etc. use (see relayClient.js and equipmentClient.js).
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

export function listEquipmentUploads(accessToken, equipmentId) {
  return request('EquipmentUpload/List', { body: { equipmentId }, accessToken })
}

export function uploadEquipmentFile(accessToken, { equipmentId, nickname, fileName, contentBase64, overwrite, uploadedAtUtc, madeByUser }) {
  return request('EquipmentUpload/Upload', {
    body: { equipmentId, nickname, fileName, contentBase64, overwrite, uploadedAtUtc, madeByUser },
    accessToken,
  })
}

export function downloadEquipmentFile(accessToken, id) {
  return request('EquipmentUpload/Download', { body: { id }, accessToken })
}

export function deleteEquipmentFile(accessToken, { id, actionTimeUtc, madeByUser }) {
  return request('EquipmentUpload/Delete', { body: { id, actionTimeUtc, madeByUser }, accessToken })
}

const ERROR_CODE_KEYS = {
  NicknameRequired: 'equipmentUpload.nicknameRequired',
  FileRequired: 'equipmentUpload.fileRequired',
  FileNameInvalid: 'equipmentUpload.fileNameInvalid',
  FileTooLarge: 'equipmentUpload.fileTooLarge',
  FileAlreadyExists: 'equipmentUpload.fileAlreadyExists',
  EquipmentNotFound: 'equipmentUpload.equipmentNotFound',
  FileMissingOnDisk: 'equipmentUpload.fileMissingOnDisk',
  NotFound: 'equipmentUpload.notFound',
  StorageNotConfigured: 'equipmentUpload.storageNotConfigured',
  DateTimeRequired: 'equipmentUpload.dateTimeRequired',
  MadeByUserRequired: 'equipmentUpload.madeByUserRequired',
}

export function describeUploadError(err, t) {
  const key = ERROR_CODE_KEYS[err.code]
  return key ? t(key) : err.message
}
