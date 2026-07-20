import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { uploadEquipmentFile, describeUploadError } from './equipmentUploadClient'
import { arrayBufferToBase64 } from './base64'

// onUploaded() - called after a successful upload (or overwrite). The caller is responsible for
// closing this modal and refetching the file list.
export default function EquipmentUploadModal({ equipmentId, onUploaded, onCancel }) {
  const { t } = useTranslation()
  const { authFetch, user } = useAuth()
  const [nickname, setNickname] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef(null)

  // Set only when the server reports FileAlreadyExists - holds the already-encoded upload so a
  // confirmed overwrite can resubmit without re-reading the file.
  const [pendingOverwrite, setPendingOverwrite] = useState(null)

  async function doUpload({ contentBase64, fileName, overwrite }) {
    const uploadedAtUtc = new Date().toISOString()
    return authFetch((token) =>
      uploadEquipmentFile(token, { equipmentId, nickname, fileName, contentBase64, overwrite, uploadedAtUtc, madeByUser: user.email })
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!nickname.trim()) {
      setError(t('equipmentUpload.nicknameRequired'))
      return
    }
    if (!file) {
      setError(t('equipmentUpload.fileRequired'))
      return
    }

    setBusy(true)
    const buffer = await file.arrayBuffer()
    const contentBase64 = arrayBufferToBase64(buffer)
    try {
      await doUpload({ contentBase64, fileName: file.name, overwrite: false })
      onUploaded()
    } catch (err) {
      if (err.code === 'FileAlreadyExists') {
        setPendingOverwrite({ contentBase64, fileName: file.name })
      } else {
        setError(describeUploadError(err, t))
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleOverwriteConfirm() {
    setError(null)
    setBusy(true)
    try {
      await doUpload({ ...pendingOverwrite, overwrite: true })
      onUploaded()
    } catch (err) {
      setPendingOverwrite(null)
      setError(describeUploadError(err, t))
    } finally {
      setBusy(false)
    }
  }

  if (pendingOverwrite) {
    return (
      <div className="modal-backdrop" onClick={() => setPendingOverwrite(null)}>
        <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <h2>{t('equipmentUpload.overwriteConfirmTitle')}</h2>
          <p>{t('equipmentUpload.overwriteConfirmMessage', { fileName: pendingOverwrite.fileName })}</p>
          {error && <p className="login-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={() => setPendingOverwrite(null)} disabled={busy}>
              {t('equipment.cancelButton')}
            </button>
            <button type="button" className="modal-ok modal-danger" onClick={handleOverwriteConfirm} disabled={busy}>
              {t('equipmentUpload.overwriteButton')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <h2>{t('equipmentUpload.uploadTitle')}</h2>

          <label className="login-field">
            <span>{t('equipmentUpload.nicknameLabel')}</span>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={busy}
              autoFocus
            />
          </label>

          <label className="login-field">
            <span>{t('equipmentUpload.fileLabel')}</span>
            {/* The native <input type="file"> button ("Choose File"/"Browse...") and its
                "No file chosen" text are rendered by the browser itself in the browser's own UI
                language - no i18n string can override them. Hide the native control visually and
                drive it from our own translated button + filename text instead. */}
            <div className="equipment-upload-file-picker">
              <button
                type="button"
                className="modal-cancel"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
              >
                {t('equipmentUpload.chooseFileButton')}
              </button>
              <span className="equipment-upload-file-name">
                {file ? file.name : t('equipmentUpload.noFileSelected')}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                className="equipment-upload-file-input-hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={busy}
              />
            </div>
          </label>

          {error && <p className="login-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onCancel} disabled={busy}>
              {t('equipment.cancelButton')}
            </button>
            <button type="submit" className="login-submit" disabled={busy}>
              {t('equipmentUpload.uploadButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
