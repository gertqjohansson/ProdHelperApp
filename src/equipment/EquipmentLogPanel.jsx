import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { listEquipmentLogs, deleteEquipmentLog, describeLogError } from './equipmentLogClient'
import { parseUtc } from './dateTimeUtc'
import EquipmentLogModal from './EquipmentLogModal'
import EquipmentLogViewModal from './EquipmentLogViewModal'

// selectedItem - the currently selected equipment (or null). Mirrors EquipmentUploadsPanel/EquipmentLinksPanel.
export default function EquipmentLogPanel({ selectedItem }) {
  const { t, i18n } = useTranslation()
  const { authFetch } = useAuth()

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedLogId, setSelectedLogId] = useState(null)
  const [searchText, setSearchText] = useState('')

  const [formMode, setFormMode] = useState(null) // null | 'add' | 'edit'
  const [viewingLog, setViewingLog] = useState(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    setSelectedLogId(null)
    setSearchText('')
    if (!selectedItem) {
      setLogs([])
      return
    }
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id])

  async function reload() {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch((token) => listEquipmentLogs(token, selectedItem.id))
      setLogs(res.items)
    } catch (err) {
      setError(describeLogError(err, t))
    } finally {
      setLoading(false)
    }
  }

  function handleSaved() {
    setFormMode(null)
    reload()
  }

  function openDeleteConfirm() {
    setDeleteError(null)
    setDeleteConfirmOpen(true)
  }

  async function handleDeleteConfirm() {
    setDeleteError(null)
    setDeleteBusy(true)
    try {
      await authFetch((token) => deleteEquipmentLog(token, selectedLogId))
      setDeleteConfirmOpen(false)
      setSelectedLogId(null)
      await reload()
    } catch (err) {
      setDeleteError(describeLogError(err, t))
    } finally {
      setDeleteBusy(false)
    }
  }

  const selectedLog = logs.find((l) => l.id === selectedLogId) ?? null

  const lowerSearch = searchText.trim().toLowerCase()
  const visibleLogs = lowerSearch
    ? logs.filter(
        (l) => l.nickname.toLowerCase().includes(lowerSearch) || l.logText.toLowerCase().includes(lowerSearch)
      )
    : logs

  return (
    <div className="equipment-page-section">
      <div className="equipments-menubar">
        <span className="equipments-menubar-title">{t('equipmentLog.sectionTitle')}</span>
        <div className="equipments-menubar-actions">
          <button
            type="button"
            className="equipments-toolbar-button"
            onClick={() => setFormMode('add')}
            disabled={!selectedItem}
          >
            {t('equipmentLog.addButton')}
          </button>
          <button
            type="button"
            className="equipments-toolbar-button"
            onClick={() => selectedLog && setViewingLog(selectedLog)}
            disabled={!selectedLog}
          >
            {t('equipmentLog.viewButton')}
          </button>
          <button
            type="button"
            className="equipments-toolbar-button"
            onClick={() => setFormMode('edit')}
            disabled={!selectedLog}
          >
            {t('equipmentLog.editButton')}
          </button>
          <button
            type="button"
            className="equipments-toolbar-button equipments-toolbar-button-danger"
            onClick={openDeleteConfirm}
            disabled={!selectedLog}
          >
            {t('equipmentLog.deleteButton')}
          </button>
        </div>
      </div>

      {selectedItem && (
        <div className="equipments-search-row">
          <svg className="equipments-search-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="21" y1="21" x2="16.3" y2="16.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            className="equipments-search"
            placeholder={t('equipmentLog.searchPlaceholder')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      )}

      {!selectedItem ? (
        <p className="equipments-comment-no-selection">{t('equipmentLog.noEquipmentSelected')}</p>
      ) : loading ? (
        <p>{t('status.sending')}</p>
      ) : error ? (
        <p className="login-error">{error}</p>
      ) : visibleLogs.length === 0 ? (
        <p className="equipments-comment-no-selection">{t('equipmentLog.emptyTable')}</p>
      ) : (
        <table className="equipment-page-table">
          <thead>
            <tr>
              <th>{t('equipmentLog.nicknameHeader')}</th>
              <th>{t('equipmentLog.createdByHeader')}</th>
              <th>{t('equipmentLog.dateHeader')}</th>
            </tr>
          </thead>
          <tbody>
            {visibleLogs.map((log) => (
              <tr
                key={log.id}
                className={log.id === selectedLogId ? 'selected' : ''}
                onClick={() => setSelectedLogId(log.id)}
              >
                <td>
                  <button
                    type="button"
                    className="equipment-log-nickname-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setViewingLog(log)
                    }}
                  >
                    {log.nickname}
                  </button>
                </td>
                <td>{log.createdBy}</td>
                <td>
                  {new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(
                    parseUtc(log.dateTimeUtc)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {formMode && selectedItem && (
        <EquipmentLogModal
          mode={formMode}
          equipmentId={selectedItem.id}
          logId={selectedLog?.id}
          initialValues={formMode === 'edit' && selectedLog ? { nickname: selectedLog.nickname, logText: selectedLog.logText } : null}
          onSave={handleSaved}
          onCancel={() => setFormMode(null)}
        />
      )}

      {viewingLog && <EquipmentLogViewModal log={viewingLog} onClose={() => setViewingLog(null)} />}

      {deleteConfirmOpen && selectedLog && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>{t('equipmentLog.deleteConfirmTitle')}</h2>
            <p>{t('equipmentLog.deleteConfirmMessage', { nickname: selectedLog.nickname })}</p>
            {deleteError && <p className="login-error">{deleteError}</p>}
            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={() => setDeleteConfirmOpen(false)} disabled={deleteBusy}>
                {t('equipment.cancelButton')}
              </button>
              <button type="button" className="modal-ok modal-danger" onClick={handleDeleteConfirm} disabled={deleteBusy}>
                {t('equipment.deleteButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
