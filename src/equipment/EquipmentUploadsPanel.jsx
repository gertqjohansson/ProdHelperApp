import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { listEquipmentUploads, downloadEquipmentFile, deleteEquipmentFile, describeUploadError } from './equipmentUploadClient'
import { base64ToUint8Array } from './base64'
import EquipmentUploadModal from './EquipmentUploadModal'

// selectedItem - the currently selected equipment (or null). Mirrors how EquipmentCommentPanel
// receives selection state from EquipmentsPage.
export default function EquipmentUploadsPanel({ selectedItem }) {
  const { t } = useTranslation()
  const { authFetch, user } = useAuth()

  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedUploadId, setSelectedUploadId] = useState(null)

  const [showUploadModal, setShowUploadModal] = useState(false)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const [downloadError, setDownloadError] = useState(null)

  useEffect(() => {
    setSelectedUploadId(null)
    if (!selectedItem) {
      setUploads([])
      return
    }
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id])

  async function reload() {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch((token) => listEquipmentUploads(token, selectedItem.id))
      setUploads(res.items)
    } catch (err) {
      setError(describeUploadError(err, t))
    } finally {
      setLoading(false)
    }
  }

  function handleUploaded() {
    setShowUploadModal(false)
    reload()
  }

  async function handleDownload() {
    setDownloadError(null)
    try {
      const res = await authFetch((token) => downloadEquipmentFile(token, selectedUploadId))
      const bytes = base64ToUint8Array(res.contentBase64)
      const blob = new Blob([bytes], { type: res.contentType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = res.fileName
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setDownloadError(describeUploadError(err, t))
    }
  }

  function openDeleteConfirm() {
    setDeleteError(null)
    setDeleteConfirmOpen(true)
  }

  async function handleDeleteConfirm() {
    setDeleteError(null)
    setDeleteBusy(true)
    try {
      await authFetch((token) =>
        deleteEquipmentFile(token, { id: selectedUploadId, actionTimeUtc: new Date().toISOString(), madeByUser: user.email })
      )
      setDeleteConfirmOpen(false)
      setSelectedUploadId(null)
      await reload()
    } catch (err) {
      setDeleteError(describeUploadError(err, t))
    } finally {
      setDeleteBusy(false)
    }
  }

  const selectedUpload = uploads.find((u) => u.id === selectedUploadId) ?? null

  return (
    <div className="equipment-page-section">
      <div className="equipments-menubar">
        <span className="equipments-menubar-title">{t('equipmentUpload.sectionTitle')}</span>
        <div className="equipments-menubar-actions">
          <button
            type="button"
            className="equipments-toolbar-button"
            onClick={() => setShowUploadModal(true)}
            disabled={!selectedItem}
          >
            {t('equipmentUpload.uploadButton')}
          </button>
          <button
            type="button"
            className="equipments-toolbar-button"
            onClick={handleDownload}
            disabled={!selectedUpload}
          >
            {t('equipmentUpload.downloadButton')}
          </button>
          <button
            type="button"
            className="equipments-toolbar-button equipments-toolbar-button-danger"
            onClick={openDeleteConfirm}
            disabled={!selectedUpload}
          >
            {t('equipmentUpload.deleteButton')}
          </button>
        </div>
      </div>

      {downloadError && <p className="login-error">{downloadError}</p>}

      {!selectedItem ? (
        <p className="equipments-comment-no-selection">{t('equipmentUpload.noEquipmentSelected')}</p>
      ) : loading ? (
        <p>{t('status.sending')}</p>
      ) : error ? (
        <p className="login-error">{error}</p>
      ) : uploads.length === 0 ? (
        <p className="equipments-comment-no-selection">{t('equipmentUpload.emptyTable')}</p>
      ) : (
        <table className="equipment-page-table">
          <thead>
            <tr>
              <th>{t('equipmentUpload.nicknameHeader')}</th>
              <th>{t('equipmentUpload.fileNameHeader')}</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((upload) => (
              <tr
                key={upload.id}
                className={upload.id === selectedUploadId ? 'selected' : ''}
                onClick={() => setSelectedUploadId(upload.id)}
              >
                <td>{upload.nickname}</td>
                <td>{upload.fileName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showUploadModal && selectedItem && (
        <EquipmentUploadModal
          equipmentId={selectedItem.id}
          onUploaded={handleUploaded}
          onCancel={() => setShowUploadModal(false)}
        />
      )}

      {deleteConfirmOpen && selectedUpload && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>{t('equipmentUpload.deleteConfirmTitle')}</h2>
            <p>{t('equipmentUpload.deleteConfirmMessage', { nickname: selectedUpload.nickname })}</p>
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
