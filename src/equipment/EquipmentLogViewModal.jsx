import { useTranslation } from 'react-i18next'
import { parseUtc } from './dateTimeUtc'

// log: { nickname, createdBy, dateTimeUtc, logText }. Read-only - this is intentionally not the
// generic components/Modal.jsx (title+message+OK), which can't show the author/date metadata.
export default function EquipmentLogViewModal({ log, onClose }) {
  const { t, i18n } = useTranslation()

  const formattedDate = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(
    parseUtc(log.dateTimeUtc)
  )

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2>{log.nickname}</h2>
        <p className="equipments-comment-language-note">
          {t('equipmentLog.viewMetaLabel', { createdBy: log.createdBy, date: formattedDate })}
        </p>
        <div className="equipment-log-view-text">{log.logText}</div>
        <div className="modal-actions">
          <button type="button" className="modal-ok" onClick={onClose} autoFocus>
            {t('equipmentLog.closeButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
