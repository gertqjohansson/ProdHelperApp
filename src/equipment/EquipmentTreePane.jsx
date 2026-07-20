import { useTranslation } from 'react-i18next'
import EquipmentTree from './EquipmentTree'

// The search + tree UI shared between EquipmentsPage and any other page that needs to show the
// same equipment tree (e.g. ShiftsCalendarPage). Data fetching stays with the caller - pages fetch
// differently (EquipmentsPage also loads categories in the same round trip).
export default function EquipmentTreePane({ tree, selectedId, onSelect, loading, error, filterText, onFilterTextChange }) {
  const { t } = useTranslation()

  return (
    <div className="equipments-tree-pane">
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
          onChange={(e) => onFilterTextChange(e.target.value)}
        />
      </div>
      {loading ? (
        <p>{t('status.sending')}</p>
      ) : error ? (
        <p className="login-error">{error}</p>
      ) : tree.length === 0 ? (
        <p>{t('equipment.emptyTree')}</p>
      ) : (
        <EquipmentTree nodes={tree} selectedId={selectedId} onSelect={onSelect} forceExpanded={!!filterText} />
      )}
    </div>
  )
}
