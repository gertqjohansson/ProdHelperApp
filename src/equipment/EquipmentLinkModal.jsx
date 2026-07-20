import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { createEquipmentLink, describeLinkError } from './equipmentLinkClient'

// onSave() - called after a successful create. The caller is responsible for closing this modal
// and refetching the link list. Mirrors the EquipmentFormModal/EquipmentUploadModal contract.
export default function EquipmentLinkModal({ equipmentId, onSave, onCancel }) {
  const { t } = useTranslation()
  const { authFetch, user } = useAuth()
  const [nickname, setNickname] = useState('')
  const [path, setPath] = useState('')
  const [isDocument, setIsDocument] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!nickname.trim()) {
      setError(t('equipmentLink.nicknameRequired'))
      return
    }
    if (!path.trim()) {
      setError(t('equipmentLink.pathRequired'))
      return
    }

    setBusy(true)
    try {
      await authFetch((token) =>
        createEquipmentLink(token, {
          equipmentId,
          nickname,
          path,
          isDocument,
          actionTimeUtc: new Date().toISOString(),
          madeByUser: user.email,
        })
      )
      onSave()
    } catch (err) {
      setError(describeLinkError(err, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <h2>{t('equipmentLink.addTitle')}</h2>

          <label className="login-field">
            <span>{t('equipmentLink.nicknameLabel')}</span>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={busy}
              autoFocus
            />
          </label>

          <label className="login-field">
            <span>{t('equipmentLink.pathLabel')}</span>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="https://..."
              disabled={busy}
            />
          </label>

          <label className="equipment-checkbox-field">
            <input type="checkbox" checked={isDocument} onChange={(e) => setIsDocument(e.target.checked)} disabled={busy} />
            <span>{t('equipmentLink.isDocumentLabel')}</span>
          </label>

          {error && <p className="login-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onCancel} disabled={busy}>
              {t('equipment.cancelButton')}
            </button>
            <button type="submit" className="login-submit" disabled={busy}>
              {t('equipment.saveButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
