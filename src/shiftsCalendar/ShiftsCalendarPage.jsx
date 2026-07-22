import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { listEquipment, moveEquipmentSchiftParent } from '../equipment/equipmentClient'
import { buildTree, filterTree } from '../equipment/treeUtils'
import EquipmentTreePane from '../equipment/EquipmentTreePane'
import EquipmentMoveModal from '../equipment/EquipmentMoveModal'
import ShiftCalendarPlayground from './ShiftCalendarPlayground'
import CreateCalendarModal from './CreateCalendarModal'
import { createShiftScheduleVersion, getLatestShiftScheduleVersion, listEquipmentIdsWithSchedule } from './shiftScheduleClient'

function MoveIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="5 9 2 12 5 15" />
      <polyline points="9 5 12 2 15 5" />
      <polyline points="15 19 12 22 9 19" />
      <polyline points="19 9 22 12 19 15" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
  )
}

function CreateCalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <line x1="4" y1="10" x2="20" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <line x1="9" y1="15" x2="15" y2="15" />
      <line x1="12" y1="12" x2="12" y2="18" />
    </svg>
  )
}

// Shows the equipment tree keyed on schiftParentId (a separate hierarchy from EquipmentsPage's
// parentId-based tree) via the shared EquipmentTreePane/treeUtils, plus a "Move" action that only
// ever changes schiftParentId - see EquipmentController.MoveSchiftParent on the backend.
export default function ShiftsCalendarPage() {
  const { t, i18n } = useTranslation()
  const { authFetch } = useAuth()

  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterText, setFilterText] = useState('')
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [createCalendarModalOpen, setCreateCalendarModalOpen] = useState(false)
  const [previousScheduleStartDate, setPreviousScheduleStartDate] = useState(null)
  const [equipmentIdsWithSchedule, setEquipmentIdsWithSchedule] = useState(new Set())

  useEffect(() => {
    let cancelled = false
    Promise.all([
      authFetch((token) => listEquipment(token, i18n.language)),
      authFetch((token) => listEquipmentIdsWithSchedule(token)),
    ])
      .then(([equipmentRes, scheduleRes]) => {
        if (cancelled) return
        setItems(equipmentRes.items)
        setEquipmentIdsWithSchedule(new Set(scheduleRes.equipmentIds))
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
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
    const res = await authFetch((token) => listEquipment(token, i18n.language))
    setItems(res.items)
  }

  const selectedItem = items.find((i) => i.id === selectedId) ?? null
  const tree = filterTree(buildTree(items, (i) => i.schiftParentId ?? null), filterText)

  async function handleMoveSave(newSchiftParentId) {
    if (!selectedItem) return
    try {
      await authFetch((token) =>
        moveEquipmentSchiftParent(token, { id: selectedItem.id, schiftParentId: newSchiftParentId })
      )
      setMoveModalOpen(false)
      await reload()
    } catch (err) {
      throw new Error(err.message)
    }
  }

  async function handleOpenCreateCalendar() {
    if (!selectedItem) return
    const latest = await authFetch((token) => getLatestShiftScheduleVersion(token, selectedItem.id))
    setPreviousScheduleStartDate(latest ? latest.startDate : null)
    setCreateCalendarModalOpen(true)
  }

  async function handleCreateCalendarSave({ startDate, daysInScedule }) {
    if (!selectedItem) return
    try {
      await authFetch((token) =>
        createShiftScheduleVersion(token, { equipmentId: selectedItem.id, startDate, daysInScedule })
      )
      setCreateCalendarModalOpen(false)
      setEquipmentIdsWithSchedule((prev) => new Set(prev).add(selectedItem.id))
    } catch (err) {
      throw new Error(err.message)
    }
  }

  return (
    <div className="equipments-page">
      <div className="equipments-menubar">
        <span className="equipments-menubar-title">{t('shiftsCalendar.pageTitle')}</span>
        <div className="equipments-menubar-actions">
          <button type="button" className="equipments-toolbar-button" onClick={() => setMoveModalOpen(true)} disabled={!selectedItem}>
            <MoveIcon />
            {t('equipment.moveButton')}
          </button>
          <button
            type="button"
            className="equipments-toolbar-button"
            onClick={handleOpenCreateCalendar}
            disabled={!selectedItem}
          >
            <CreateCalendarIcon />
            {t('shiftsCalendar.createCalendarButton')}
          </button>
        </div>
      </div>

      <div className="equipments-body">
        <EquipmentTreePane
          tree={tree}
          selectedId={selectedId}
          onSelect={setSelectedId}
          loading={loading}
          error={error}
          filterText={filterText}
          onFilterTextChange={setFilterText}
          showBadges={false}
          equipmentIdsWithSchedule={equipmentIdsWithSchedule}
        />

        <div className="equipments-comment-pane shiftscalendar-pane">
          {selectedItem ? (
            <ShiftCalendarPlayground equipmentName={selectedItem.name} />
          ) : (
            <p className="equipments-comment-no-selection">{t('shiftsCalendar.noSelection')}</p>
          )}
        </div>
      </div>

      {moveModalOpen && selectedItem && (
        <EquipmentMoveModal
          item={selectedItem}
          items={items}
          parentField="schiftParentId"
          onSave={handleMoveSave}
          onCancel={() => setMoveModalOpen(false)}
        />
      )}

      {createCalendarModalOpen && selectedItem && (
        <CreateCalendarModal
          equipmentName={selectedItem.name}
          previousStartDate={previousScheduleStartDate}
          onSave={handleCreateCalendarSave}
          onCancel={() => setCreateCalendarModalOpen(false)}
        />
      )}
    </div>
  )
}
