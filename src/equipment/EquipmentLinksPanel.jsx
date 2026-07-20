import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { listEquipmentLinks, deleteEquipmentLink, describeLinkError } from './equipmentLinkClient'
import EquipmentLinkModal from './EquipmentLinkModal'

// selectedItem - the currently selected equipment (or null). Mirrors EquipmentUploadsPanel.
export default function EquipmentLinksPanel({ selectedItem }) {
  const { t } = useTranslation()
  const { authFetch, user } = useAuth()

  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedLinkId, setSelectedLinkId] = useState(null)

  const [showAddModal, setShowAddModal] = useState(false)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    setSelectedLinkId(null)
    if (!selectedItem) {
      setLinks([])
      return
    }
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id])

  async function reload() {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch((token) => listEquipmentLinks(token, selectedItem.id))
      setLinks(res.items)
    } catch (err) {
      setError(describeLinkError(err, t))
    } finally {
      setLoading(false)
    }
  }

  function handleSaved() {
    setShowAddModal(false)
    reload()
  }

  // Same mechanism for both Open and Download - the server has no SharePoint/Graph API
  // integration, so it can't force a true download of external content. Whether the browser
  // downloads or previews the target is entirely up to that URL's own server response.
  function handleOpenOrDownload() {
    if (!selectedLink) return
    window.open(selectedLink.path, '_blank', 'noopener,noreferrer')
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
        deleteEquipmentLink(token, { id: selectedLinkId, actionTimeUtc: new Date().toISOString(), madeByUser: user.email })
      )
      setDeleteConfirmOpen(false)
      setSelectedLinkId(null)
      await reload()
    } catch (err) {
      setDeleteError(describeLinkError(err, t))
    } finally {
      setDeleteBusy(false)
    }
  }

  const selectedLink = links.find((l) => l.id === selectedLinkId) ?? null

  return (
    <div className="equipment-page-section equipment-links-section">
      <div className="equipments-menubar">
        <span className="equipments-menubar-title">{t('equipmentLink.sectionTitle')}</span>
        <div className="equipments-menubar-actions">
          <button
            type="button"
            className="equipments-toolbar-button"
            onClick={() => setShowAddModal(true)}
            disabled={!selectedItem}
          >
            {t('equipmentLink.addButton')}
          </button>
          <button
            type="button"
            className="equipments-toolbar-button"
            onClick={handleOpenOrDownload}
            disabled={!selectedLink || selectedLink.isDocument}
          >
            {t('equipmentLink.openButton')}
          </button>
          <button
            type="button"
            className="equipments-toolbar-button"
            onClick={handleOpenOrDownload}
            disabled={!selectedLink || !selectedLink.isDocument}
          >
            {t('equipmentLink.downloadButton')}
          </button>
          <button
            type="button"
            className="equipments-toolbar-button equipments-toolbar-button-danger"
            onClick={openDeleteConfirm}
            disabled={!selectedLink}
          >
            {t('equipmentLink.deleteButton')}
          </button>
        </div>
      </div>

      {!selectedItem ? (
        <p className="equipments-comment-no-selection">{t('equipmentLink.noEquipmentSelected')}</p>
      ) : loading ? (
        <p>{t('status.sending')}</p>
      ) : error ? (
        <p className="login-error">{error}</p>
      ) : links.length === 0 ? (
        <p className="equipments-comment-no-selection">{t('equipmentLink.emptyTable')}</p>
      ) : (
        <table className="equipment-page-table">
          <thead>
            <tr>
              <th>{t('equipmentLink.nicknameHeader')}</th>
              <th>{t('equipmentLink.pathHeader')}</th>
              <th>{t('equipmentLink.typeHeader')}</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <tr
                key={link.id}
                className={link.id === selectedLinkId ? 'selected' : ''}
                onClick={() => setSelectedLinkId(link.id)}
              >
                <td>{link.nickname}</td>
                <td>{link.path}</td>
                <td>{t(link.isDocument ? 'equipmentLink.typeDocument' : 'equipmentLink.typeWebpage')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showAddModal && selectedItem && (
        <EquipmentLinkModal
          equipmentId={selectedItem.id}
          onSave={handleSaved}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {deleteConfirmOpen && selectedLink && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>{t('equipmentLink.deleteConfirmTitle')}</h2>
            <p>{t('equipmentLink.deleteConfirmMessage', { nickname: selectedLink.nickname })}</p>
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
