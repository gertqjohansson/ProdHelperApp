import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { listEquipment, createEquipment, updateEquipment, deleteEquipment, saveEquipmentComment } from './equipmentClient'
import { listEquipmentCategories } from './equipmentCategoryClient'
import { buildTree, filterTree } from './treeUtils'
import EquipmentTreePane from './EquipmentTreePane'
import EquipmentFormModal from './EquipmentFormModal'
import EquipmentCategoryManagerModal from './EquipmentCategoryManagerModal'
import EquipmentCommentPanel from './EquipmentCommentPanel'
import EquipmentUploadsPanel from './EquipmentUploadsPanel'
import EquipmentLinksPanel from './EquipmentLinksPanel'
import EquipmentLogPanel from './EquipmentLogPanel'

const DEFAULT_COLOR = '#cccccc'

function AddIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="4 7 20 7" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M18 7l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
    </svg>
  )
}

const ERROR_CODE_KEYS = {
  NameRequired: 'equipment.nameRequired',
  ParentNotFound: 'equipment.parentNotFound',
  HasChildren: 'equipment.deleteBlockedHasChildren',
  NotFound: 'equipment.notFound',
  CategoryRequired: 'equipment.categoryRequired',
  CategoryNotFound: 'equipment.categoryNotFound',
}

function describeError(err, t) {
  const key = ERROR_CODE_KEYS[err.code]
  return key ? t(key) : err.message
}

export default function EquipmentsPage() {
  const { t, i18n } = useTranslation()
  const { authFetch, user } = useAuth()

  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterText, setFilterText] = useState('')
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false)

  const [formMode, setFormMode] = useState(null) // null | 'add' | 'edit'

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      authFetch((token) => listEquipment(token, i18n.language)),
      authFetch((token) => listEquipmentCategories(token, i18n.language)),
    ])
      .then(([equipmentRes, categoriesRes]) => {
        if (!cancelled) {
          setItems(equipmentRes.items)
          setCategories(categoriesRes.items)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(describeError(err, t))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language])

  async function reload() {
    const [equipmentRes, categoriesRes] = await Promise.all([
      authFetch((token) => listEquipment(token, i18n.language)),
      authFetch((token) => listEquipmentCategories(token, i18n.language)),
    ])
    setItems(equipmentRes.items)
    setCategories(categoriesRes.items)
  }

  function handleCategoriesModalClose(changed) {
    setManageCategoriesOpen(false)
    if (changed) reload()
  }

  const selectedItem = items.find((i) => i.id === selectedId) ?? null
  const tree = filterTree(buildTree(items), filterText)
  const usedColors = [...new Set(items.map((i) => i.colorCode).filter(Boolean))]

  function openAdd() {
    if (categories.length === 0) return
    setFormMode('add')
  }

  function openEdit() {
    if (!selectedItem) return
    setFormMode('edit')
  }

  function closeForm() {
    setFormMode(null)
  }

  async function handleFormSave(fields) {
    const { isTopNode, ...rest } = fields
    const actionTimeUtc = new Date().toISOString()
    try {
      if (formMode === 'add') {
        const parentId = isTopNode ? null : selectedItem ? selectedItem.id : null
        await authFetch((token) =>
          createEquipment(token, { parentId, ...rest, languageIsoCode: i18n.language, actionTimeUtc, madeByUser: user.email })
        )
      } else if (formMode === 'edit' && selectedItem) {
        const parentId = isTopNode ? null : selectedItem.parentId
        await authFetch((token) =>
          updateEquipment(token, { id: selectedItem.id, parentId, ...rest, languageIsoCode: i18n.language, actionTimeUtc, madeByUser: user.email })
        )
      }
      setFormMode(null)
      await reload()
    } catch (err) {
      throw new Error(describeError(err, t))
    }
  }

  const formInitialValues =
    formMode === 'edit' && selectedItem
      ? {
          isTopNode: selectedItem.parentId == null,
          name: selectedItem.name,
          externalCode: selectedItem.externalCode ?? '',
          isOee: !!selectedItem.isOee,
          isPlannable: !!selectedItem.isPlannable,
          colorCode: selectedItem.colorCode ?? DEFAULT_COLOR,
          categoryId: selectedItem.equipmentCategoryId ? String(selectedItem.equipmentCategoryId) : '',
          useEconomy: !!selectedItem.useEconomy,
          dateOfPurchase: selectedItem.dateOfPurchase ?? null,
          price: selectedItem.price ?? null,
          depreciationPeriod: selectedItem.depreciationPeriod ?? null,
          useNotification: !!selectedItem.useNotification,
          notificationDate: selectedItem.notificationDate ?? null,
          notification: selectedItem.notification ?? '',
          notificationLanguage: selectedItem.notificationLanguage ?? null,
        }
      : {
          isTopNode: !selectedItem,
          name: '',
          externalCode: '',
          isOee: false,
          isPlannable: false,
          colorCode: DEFAULT_COLOR,
          categoryId: categories[0] ? String(categories[0].id) : '',
          useEconomy: false,
          dateOfPurchase: null,
          price: null,
          depreciationPeriod: null,
          useNotification: false,
          notificationDate: null,
          notification: '',
          notificationLanguage: null,
        }

  async function handleCommentSave(comment) {
    try {
      await authFetch((token) => saveEquipmentComment(token, { id: selectedItem.id, comment, languageIsoCode: i18n.language }))
      await reload()
    } catch (err) {
      throw new Error(describeError(err, t))
    }
  }

  function openDeleteConfirm() {
    setDeleteError(null)
    setDeleteConfirmOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!selectedItem) return
    setDeleteError(null)
    setDeleteBusy(true)
    try {
      await authFetch((token) =>
        deleteEquipment(token, { id: selectedItem.id, actionTimeUtc: new Date().toISOString(), madeByUser: user.email })
      )
      setDeleteConfirmOpen(false)
      setSelectedId(null)
      await reload()
    } catch (err) {
      setDeleteError(describeError(err, t))
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="equipments-page">
      <div className="equipments-menubar">
        <span className="equipments-menubar-title">{t('equipment.pageTitle')}</span>
        <div className="equipments-menubar-actions">
          <button type="button" className="equipments-toolbar-button" onClick={openAdd} disabled={categories.length === 0}>
            <AddIcon />
            {t('equipment.addButton')}
          </button>
          <button type="button" className="equipments-toolbar-button" onClick={openEdit} disabled={!selectedItem}>
            <EditIcon />
            {t('equipment.editButton')}
          </button>
          <button
            type="button"
            className="equipments-toolbar-button equipments-toolbar-button-danger"
            onClick={openDeleteConfirm}
            disabled={!selectedItem}
          >
            <DeleteIcon />
            {t('equipment.deleteButton')}
          </button>
          <button type="button" className="equipments-toolbar-button" onClick={() => setManageCategoriesOpen(true)}>
            <FolderIcon />
            {t('equipmentCategory.manageButton')}
          </button>
        </div>
      </div>

      {categories.length === 0 && <p className="equipments-no-categories">{t('equipment.noCategoriesMessage')}</p>}

      <div className="equipments-body">
        <EquipmentTreePane
          tree={tree}
          selectedId={selectedId}
          onSelect={setSelectedId}
          loading={loading}
          error={error}
          filterText={filterText}
          onFilterTextChange={setFilterText}
        />

        <EquipmentCommentPanel selectedItem={selectedItem} onSave={handleCommentSave} />

        <EquipmentUploadsPanel selectedItem={selectedItem} />
      </div>

      <div className="equipments-body">
        <EquipmentLinksPanel selectedItem={selectedItem} />

        <EquipmentLogPanel selectedItem={selectedItem} />
      </div>

      {formMode && (
        <EquipmentFormModal
          mode={formMode}
          categories={categories}
          usedColors={usedColors}
          initialValues={formInitialValues}
          onSave={handleFormSave}
          onCancel={closeForm}
        />
      )}

      {deleteConfirmOpen && selectedItem && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>{t('equipment.deleteConfirmTitle')}</h2>
            <p>{t('equipment.deleteConfirmMessage', { name: selectedItem.name })}</p>
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

      {manageCategoriesOpen && <EquipmentCategoryManagerModal onClose={handleCategoriesModalClose} />}
    </div>
  )
}
