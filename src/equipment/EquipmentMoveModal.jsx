import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buildTree, flattenTreeExcluding } from './treeUtils'

// item - the equipment being moved. items - the full flat list, used to build the parent picker.
// parentField - which field on item/items represents this hierarchy's parent link (defaults to
// parentId; pass "schiftParentId" to move within the Shifts & Calendar hierarchy instead).
// onSave(newParentId) - newParentId is null for top level. Must resolve on success (the caller
// closes this modal) or throw an Error whose message is already a user-facing translated string.
export default function EquipmentMoveModal({ item, items, onSave, onCancel, parentField = 'parentId' }) {
  const { t } = useTranslation()
  const currentParentValue = item[parentField] == null ? '' : String(item[parentField])
  const [parentValue, setParentValue] = useState(currentParentValue)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const candidates = flattenTreeExcluding(buildTree(items, (i) => i[parentField] ?? null), item.id)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await onSave(parentValue === '' ? null : Number(parentValue))
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <h2>{t('equipment.moveTitle', { name: item.name })}</h2>
          <label className="login-field">
            <span>{t('equipment.parentLabel')}</span>
            <select value={parentValue} onChange={(e) => setParentValue(e.target.value)} autoFocus>
              <option value="">{t('equipment.parentRootOption')}</option>
              {candidates.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {'    '.repeat(c.depth) + c.name}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="login-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onCancel} disabled={busy}>
              {t('equipment.cancelButton')}
            </button>
            <button type="submit" className="login-submit" disabled={busy || parentValue === currentParentValue}>
              {t('equipment.saveButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
