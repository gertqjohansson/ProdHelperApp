import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { listEquipment } from '../equipment/equipmentClient'
import { buildTree, filterTree } from '../equipment/treeUtils'
import EquipmentTreePane from '../equipment/EquipmentTreePane'

// Shows the same equipment tree as EquipmentsPage (via the shared EquipmentTreePane/treeUtils) so
// shifts/calendar entries can be attached to an equipment item the same way uploads/links/logs are.
export default function ShiftsCalendarPage() {
  const { t, i18n } = useTranslation()
  const { authFetch } = useAuth()

  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterText, setFilterText] = useState('')

  useEffect(() => {
    let cancelled = false
    authFetch((token) => listEquipment(token, i18n.language))
      .then((res) => {
        if (!cancelled) setItems(res.items)
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

  const selectedItem = items.find((i) => i.id === selectedId) ?? null
  const tree = filterTree(buildTree(items), filterText)

  return (
    <div className="equipments-page">
      <div className="equipments-menubar">
        <span className="equipments-menubar-title">{t('shiftsCalendar.pageTitle')}</span>
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
        />

        <div className="equipments-comment-pane">
          {selectedItem ? (
            <h3>{selectedItem.name}</h3>
          ) : (
            <p className="equipments-comment-no-selection">{t('shiftsCalendar.noSelection')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
