import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import {
  listEquipmentCategories,
  createEquipmentCategory,
  updateEquipmentCategory,
  deleteEquipmentCategory,
} from './equipmentCategoryClient'

const DEFAULT_COLOR = '#cccccc'

const ERROR_CODE_KEYS = {
  NameRequired: 'equipmentCategory.nameRequired',
  CategoryInUse: 'equipmentCategory.deleteBlockedInUse',
  NotFound: 'equipmentCategory.notFound',
}

function describeError(err, t) {
  const key = ERROR_CODE_KEYS[err.code]
  return key ? t(key) : err.message
}

// onClose(changed) - changed is true if any category was added/edited/deleted,
// so the Equipment page knows whether to refetch its own lists.
export default function EquipmentCategoryManagerModal({ onClose }) {
  const { t, i18n } = useTranslation()
  const { authFetch } = useAuth()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [changed, setChanged] = useState(false)

  const [formMode, setFormMode] = useState(null) // null | 'add' | 'edit'
  const [formId, setFormId] = useState(null)
  const [formName, setFormName] = useState('')
  const [formColorCode, setFormColorCode] = useState(DEFAULT_COLOR)
  const [formError, setFormError] = useState(null)
  const [busy, setBusy] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    authFetch((token) => listEquipmentCategories(token, i18n.language))
      .then((res) => {
        if (!cancelled) setCategories(res.items)
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
    const res = await authFetch((token) => listEquipmentCategories(token, i18n.language))
    setCategories(res.items)
  }

  function handleClose() {
    onClose(changed)
  }

  const usedCategoryColors = [...new Set(categories.map((c) => c.colorCode).filter(Boolean))]

  function openAdd() {
    setFormMode('add')
    setFormId(null)
    setFormName('')
    setFormColorCode(DEFAULT_COLOR)
    setFormError(null)
  }

  function openEdit(category) {
    setFormMode('edit')
    setFormId(category.id)
    setFormName(category.name)
    setFormColorCode(category.colorCode ?? DEFAULT_COLOR)
    setFormError(null)
  }

  function closeForm() {
    setFormMode(null)
    setFormError(null)
  }

  async function handleFormSubmit(e) {
    e.preventDefault()
    setFormError(null)
    setBusy(true)
    try {
      if (formMode === 'add') {
        await authFetch((token) =>
          createEquipmentCategory(token, { name: formName, colorCode: formColorCode, languageIsoCode: i18n.language })
        )
      } else if (formMode === 'edit') {
        await authFetch((token) =>
          updateEquipmentCategory(token, { id: formId, name: formName, colorCode: formColorCode, languageIsoCode: i18n.language })
        )
      }
      setFormMode(null)
      setChanged(true)
      await reload()
    } catch (err) {
      setFormError(describeError(err, t))
    } finally {
      setBusy(false)
    }
  }

  function openDeleteConfirm(category) {
    setDeleteError(null)
    setDeleteTarget(category)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleteError(null)
    setDeleteBusy(true)
    try {
      await authFetch((token) => deleteEquipmentCategory(token, deleteTarget.id))
      setDeleteTarget(null)
      setChanged(true)
      await reload()
    } catch (err) {
      setDeleteError(describeError(err, t))
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal equipment-category-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2>{t('equipmentCategory.title')}</h2>

        {formMode ? (
          <form onSubmit={handleFormSubmit}>
            <h3>{formMode === 'add' ? t('equipmentCategory.addTitle') : t('equipmentCategory.editTitle')}</h3>
            <label className="login-field">
              <span>{t('equipmentCategory.nameLabel')}</span>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required autoFocus />
            </label>
            <label className="login-field">
              <span>{t('equipmentCategory.colorCodeLabel')}</span>
              <div className="equipment-color-row">
                <input type="color" value={formColorCode || DEFAULT_COLOR} onChange={(e) => setFormColorCode(e.target.value)} />
                <select
                  className="equipment-used-colors-select"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) setFormColorCode(e.target.value)
                  }}
                >
                  <option value="">{t('equipmentCategory.usedColorsLabel')}</option>
                  {usedCategoryColors.map((color) => (
                    <option key={color} value={color} style={{ backgroundColor: color }}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            {formError && <p className="login-error">{formError}</p>}
            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={closeForm} disabled={busy}>
                {t('equipmentCategory.cancelButton')}
              </button>
              <button type="submit" className="login-submit" disabled={busy}>
                {t('equipmentCategory.saveButton')}
              </button>
            </div>
          </form>
        ) : deleteTarget ? (
          <div>
            <p>{t('equipmentCategory.deleteConfirmMessage', { name: deleteTarget.name })}</p>
            {deleteError && <p className="login-error">{deleteError}</p>}
            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={() => setDeleteTarget(null)} disabled={deleteBusy}>
                {t('equipmentCategory.cancelButton')}
              </button>
              <button type="button" className="modal-ok modal-danger" onClick={handleDeleteConfirm} disabled={deleteBusy}>
                {t('equipmentCategory.deleteButton')}
              </button>
            </div>
          </div>
        ) : (
          <>
            {loading ? (
              <p>{t('status.sending')}</p>
            ) : error ? (
              <p className="login-error">{error}</p>
            ) : categories.length === 0 ? (
              <p>{t('equipmentCategory.emptyList')}</p>
            ) : (
              <ul className="equipment-category-list">
                {categories.map((c) => (
                  <li key={c.id} className="equipment-category-list-item">
                    <span>{c.name}</span>
                    <span className="equipment-category-list-actions">
                      <button type="button" onClick={() => openEdit(c)}>
                        {t('equipmentCategory.editButton')}
                      </button>
                      <button type="button" onClick={() => openDeleteConfirm(c)}>
                        {t('equipmentCategory.deleteButton')}
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={handleClose}>
                {t('auth.close')}
              </button>
              <button type="button" className="equipments-toolbar-button" onClick={openAdd}>
                {t('equipmentCategory.addButton')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
