import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { listEquipment, createEquipment, updateEquipment, deleteEquipment } from './equipmentClient'
import { listEquipmentCategories } from './equipmentCategoryClient'
import EquipmentTree from './EquipmentTree'
import EquipmentFormModal from './EquipmentFormModal'
import EquipmentCategoryManagerModal from './EquipmentCategoryManagerModal'

const DEFAULT_COLOR = '#cccccc'

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

function buildTree(items) {
  const byParent = new Map()
  for (const item of items) {
    const parentId = item.parentId ?? null
    const list = byParent.get(parentId) ?? []
    list.push(item)
    byParent.set(parentId, list)
  }
  function attach(parentId) {
    return (byParent.get(parentId) ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => ({ ...item, children: attach(item.id) }))
  }
  return attach(null)
}

function filterTree(nodes, filterText) {
  if (!filterText) return nodes
  const lower = filterText.toLowerCase()
  return nodes
    .map((node) => {
      const children = filterTree(node.children, filterText)
      const matches = node.name.toLowerCase().includes(lower)
      return matches || children.length > 0 ? { ...node, children } : null
    })
    .filter((node) => node !== null)
}

export default function EquipmentsPage() {
  const { t, i18n } = useTranslation()
  const { authFetch } = useAuth()

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

  // Keep the tree frame's width matched to the toolbar's rendered width (the toolbar's own width
  // varies with button label length, which varies per language), so the frame ends exactly where
  // the last toolbar button ends instead of always spanning the full page width.
  const toolbarRef = useRef(null)
  const [treeFrameWidth, setTreeFrameWidth] = useState(null)

  useEffect(() => {
    const el = toolbarRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setTreeFrameWidth(entry.contentRect.width)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

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
    try {
      if (formMode === 'add') {
        const parentId = isTopNode ? null : selectedItem ? selectedItem.id : null
        await authFetch((token) => createEquipment(token, { parentId, ...rest, languageIsoCode: i18n.language }))
      } else if (formMode === 'edit' && selectedItem) {
        const parentId = isTopNode ? null : selectedItem.parentId
        await authFetch((token) => updateEquipment(token, { id: selectedItem.id, parentId, ...rest, languageIsoCode: i18n.language }))
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
      await authFetch((token) => deleteEquipment(token, selectedItem.id))
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
      <div className="equipments-toolbar" ref={toolbarRef}>
        <button type="button" className="equipments-toolbar-button" onClick={openAdd} disabled={categories.length === 0}>
          {t('equipment.addButton')}
        </button>
        <button type="button" className="equipments-toolbar-button" onClick={openEdit} disabled={!selectedItem}>
          {t('equipment.editButton')}
        </button>
        <button
          type="button"
          className="equipments-toolbar-button equipments-toolbar-button-danger"
          onClick={openDeleteConfirm}
          disabled={!selectedItem}
        >
          {t('equipment.deleteButton')}
        </button>
        <button type="button" className="equipments-toolbar-button" onClick={() => setManageCategoriesOpen(true)}>
          {t('equipmentCategory.manageButton')}
        </button>
      </div>

      {categories.length === 0 && <p className="equipments-no-categories">{t('equipment.noCategoriesMessage')}</p>}

      <div className="equipments-body">
        <div className="equipments-tree-pane" style={treeFrameWidth ? { width: treeFrameWidth } : undefined}>
          <div className="equipments-search-row">
            <svg className="equipments-search-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              <line x1="21" y1="21" x2="16.3" y2="16.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              className="equipments-search"
              placeholder={t('equipment.searchPlaceholder')}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          {loading ? (
            <p>{t('status.sending')}</p>
          ) : error ? (
            <p className="login-error">{error}</p>
          ) : tree.length === 0 ? (
            <p>{t('equipment.emptyTree')}</p>
          ) : (
            <EquipmentTree nodes={tree} selectedId={selectedId} onSelect={setSelectedId} forceExpanded={!!filterText} />
          )}
        </div>
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
