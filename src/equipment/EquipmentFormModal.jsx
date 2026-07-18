import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const DEFAULT_COLOR = '#cccccc'

function toDateInputValue(value) {
  return value ? String(value).slice(0, 10) : ''
}

// onSave(fields) - fields is { isTopNode, name, externalCode, isOee, isPlannable, colorCode, equipmentCategoryId,
// useEconomy, dateOfPurchase, price, depreciationPeriod, useNotification, notificationDate, notification }.
// Must resolve on success (the caller is responsible for closing this modal) or throw an Error
// whose message is already a user-facing translated string.
export default function EquipmentFormModal({ mode, categories, usedColors, initialValues, onSave, onCancel }) {
  const { t } = useTranslation()
  const [isTopNode, setIsTopNode] = useState(!!initialValues.isTopNode)
  const [name, setName] = useState(initialValues.name)
  const [externalCode, setExternalCode] = useState(initialValues.externalCode)
  const [isOee, setIsOee] = useState(initialValues.isOee)
  const [isPlannable, setIsPlannable] = useState(initialValues.isPlannable)
  const [colorCode, setColorCode] = useState(initialValues.colorCode)
  const [categoryId, setCategoryId] = useState(initialValues.categoryId)
  const [useEconomy, setUseEconomy] = useState(!!initialValues.useEconomy)
  const [dateOfPurchase, setDateOfPurchase] = useState(toDateInputValue(initialValues.dateOfPurchase))
  const [price, setPrice] = useState(initialValues.price ?? '')
  const [depreciationPeriod, setDepreciationPeriod] = useState(initialValues.depreciationPeriod ?? '')
  const [useNotification, setUseNotification] = useState(!!initialValues.useNotification)
  const [notificationDate, setNotificationDate] = useState(toDateInputValue(initialValues.notificationDate))
  const [notification, setNotification] = useState(initialValues.notification ?? '')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await onSave({
        isTopNode,
        name,
        externalCode: externalCode || null,
        isOee,
        isPlannable,
        colorCode: colorCode || null,
        equipmentCategoryId: Number(categoryId) || 0,
        useEconomy,
        dateOfPurchase: useEconomy && dateOfPurchase ? dateOfPurchase : null,
        price: useEconomy && price !== '' ? Number(price) : null,
        depreciationPeriod: useEconomy && depreciationPeriod !== '' ? Number(depreciationPeriod) : null,
        useNotification,
        notificationDate: useNotification && notificationDate ? notificationDate : null,
        notification: useNotification && notification ? notification : null,
      })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <h2>{mode === 'add' ? t('equipment.addTitle') : t('equipment.editTitle')}</h2>
          <label className="equipment-checkbox-field">
            <input type="checkbox" checked={isTopNode} onChange={(e) => setIsTopNode(e.target.checked)} />
            <span>{t('equipment.topNodeLabel')}</span>
          </label>
          <label className="login-field">
            <span>{t('equipment.nameLabel')}</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </label>
          <label className="login-field">
            <span>{t('equipment.categoryLabel')}</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              <option value="" disabled>
                {t('equipment.categoryLabel')}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="login-field">
            <span>{t('equipment.externalCodeLabel')}</span>
            <input type="text" value={externalCode} onChange={(e) => setExternalCode(e.target.value)} />
          </label>
          <label className="login-field">
            <span>{t('equipment.colorCodeLabel')}</span>
            <div className="equipment-color-row">
              <input type="color" value={colorCode || DEFAULT_COLOR} onChange={(e) => setColorCode(e.target.value)} />
              <select
                className="equipment-used-colors-select"
                value=""
                onChange={(e) => {
                  if (e.target.value) setColorCode(e.target.value)
                }}
              >
                <option value="">{t('equipment.usedColorsLabel')}</option>
                {usedColors.map((color) => (
                  <option key={color} value={color} style={{ backgroundColor: color }}>
                    {color}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <label className="equipment-checkbox-field">
            <input type="checkbox" checked={isOee} onChange={(e) => setIsOee(e.target.checked)} />
            <span>{t('equipment.isOeeLabel')}</span>
          </label>
          <label className="equipment-checkbox-field">
            <input type="checkbox" checked={isPlannable} onChange={(e) => setIsPlannable(e.target.checked)} />
            <span>{t('equipment.isPlannableLabel')}</span>
          </label>

          <label className="equipment-checkbox-field">
            <input type="checkbox" checked={useEconomy} onChange={(e) => setUseEconomy(e.target.checked)} />
            <span>{t('equipment.useEconomyLabel')}</span>
          </label>
          {useEconomy && (
            <div className="equipment-subfields">
              <label className="login-field">
                <span>{t('equipment.dateOfPurchaseLabel')}</span>
                <input type="date" value={dateOfPurchase} onChange={(e) => setDateOfPurchase(e.target.value)} />
              </label>
              <label className="login-field">
                <span>{t('equipment.priceLabel')}</span>
                <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
              </label>
              <label className="login-field">
                <span>{t('equipment.depreciationPeriodLabel')}</span>
                <input type="number" step="1" value={depreciationPeriod} onChange={(e) => setDepreciationPeriod(e.target.value)} />
              </label>
            </div>
          )}

          <label className="equipment-checkbox-field">
            <input type="checkbox" checked={useNotification} onChange={(e) => setUseNotification(e.target.checked)} />
            <span>{t('equipment.useNotificationLabel')}</span>
          </label>
          {useNotification && (
            <div className="equipment-subfields">
              <label className="login-field">
                <span>{t('equipment.notificationDateLabel')}</span>
                <input type="date" value={notificationDate} onChange={(e) => setNotificationDate(e.target.value)} />
              </label>
              <label className="login-field">
                <span>{t('equipment.notificationLabel')}</span>
                <textarea rows="3" value={notification} onChange={(e) => setNotification(e.target.value)} />
              </label>
            </div>
          )}

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
