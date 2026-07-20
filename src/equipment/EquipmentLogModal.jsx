import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { createEquipmentLog, updateEquipmentLog, describeLogError } from './equipmentLogClient'

// mode: 'add' | 'edit'. initialValues: { nickname, logText } (only used in edit mode).
// onSave() - called after a successful create/update. The caller is responsible for closing this
// modal and refetching the log list. Mirrors the EquipmentFormModal/EquipmentUploadModal contract.
export default function EquipmentLogModal({ mode, equipmentId, logId, initialValues, onSave, onCancel }) {
  const { t } = useTranslation()
  const { authFetch } = useAuth()
  const [nickname, setNickname] = useState(initialValues?.nickname ?? '')
  const [logText, setLogText] = useState(initialValues?.logText ?? '')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!nickname.trim()) {
      setError(t('equipmentLog.nicknameRequired'))
      return
    }
    if (!logText.trim()) {
      setError(t('equipmentLog.logTextRequired'))
      return
    }

    setBusy(true)
    const dateTimeUtc = new Date().toISOString()
    try {
      if (mode === 'add') {
        await authFetch((token) => createEquipmentLog(token, { equipmentId, nickname, logText, dateTimeUtc }))
      } else {
        await authFetch((token) => updateEquipmentLog(token, { id: logId, nickname, logText, dateTimeUtc }))
      }
      onSave()
    } catch (err) {
      setError(describeLogError(err, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <h2>{mode === 'add' ? t('equipmentLog.addTitle') : t('equipmentLog.editTitle')}</h2>

          <label className="login-field">
            <span>{t('equipmentLog.nicknameLabel')}</span>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={busy}
              autoFocus
            />
          </label>

          <label className="login-field">
            <span>{t('equipmentLog.logTextLabel')}</span>
            <textarea
              className="equipments-comment-textarea"
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              disabled={busy}
            />
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
