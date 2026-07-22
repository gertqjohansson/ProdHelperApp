import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function EquipmentTree({ nodes, selectedId, onSelect, forceExpanded, showBadges = true, equipmentIdsWithSchedule }) {
  return (
    <ul className="equipment-tree">
      {nodes.map((node) => (
        <EquipmentTreeItem
          key={node.id}
          node={node}
          selectedId={selectedId}
          onSelect={onSelect}
          forceExpanded={forceExpanded}
          showBadges={showBadges}
          equipmentIdsWithSchedule={equipmentIdsWithSchedule}
        />
      ))}
    </ul>
  )
}

function EquipmentTreeItem({ node, selectedId, onSelect, forceExpanded, showBadges, equipmentIdsWithSchedule }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0
  const showChildren = hasChildren && (forceExpanded || expanded)
  const isSelected = node.id === selectedId
  const tooltip = [
    node.name,
    `${t('equipment.idLabel')}: ${node.id}`,
    `${t('equipment.categoryLabel')}: ${node.equipmentCategoryName ?? '-'}`,
  ].join('\n')

  return (
    <li className="equipment-tree-item">
      <div
        className={`equipment-tree-row${isSelected ? ' selected' : ''}`}
        style={{ backgroundColor: isSelected ? undefined : node.colorCode || undefined }}
        title={tooltip}
      >
        {hasChildren ? (
          <button
            type="button"
            className="equipment-tree-chevron-btn"
            onClick={() => setExpanded((open) => !open)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <span className={`topbar-dropdown-chevron${showChildren ? ' open' : ''}`} aria-hidden="true">
              ›
            </span>
          </button>
        ) : (
          <span className="equipment-tree-chevron-spacer" aria-hidden="true" />
        )}
        <button type="button" className="equipment-tree-name" onClick={() => onSelect(node.id)}>
          {node.name}
        </button>
        {equipmentIdsWithSchedule?.has(node.id) && (
          <span className="equipment-tree-badge" title={t('equipment.hasScheduleLabel')} aria-label={t('equipment.hasScheduleLabel')}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="5" width="16" height="15" rx="2" />
              <line x1="4" y1="10" x2="20" y2="10" />
              <line x1="8" y1="3" x2="8" y2="7" />
              <line x1="16" y1="3" x2="16" y2="7" />
              <polyline points="8.5 14.5 11 17 15.5 12.5" />
            </svg>
          </span>
        )}
        {showBadges && (
          <span className="equipment-tree-badges">
            {node.isOee && (
              <span className="equipment-tree-badge" title={t('equipment.isOeeLabel')} aria-label={t('equipment.isOeeLabel')}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="5" y1="20" x2="5" y2="12" />
                  <line x1="12" y1="20" x2="12" y2="6" />
                  <line x1="19" y1="20" x2="19" y2="15" />
                </svg>
              </span>
            )}
            {node.isPlannable && (
              <span className="equipment-tree-badge" title={t('equipment.isPlannableLabel')} aria-label={t('equipment.isPlannableLabel')}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="5" width="16" height="15" rx="2" />
                  <line x1="4" y1="10" x2="20" y2="10" />
                  <line x1="8" y1="3" x2="8" y2="7" />
                  <line x1="16" y1="3" x2="16" y2="7" />
                </svg>
              </span>
            )}
          </span>
        )}
      </div>
      {showChildren && (
        <EquipmentTree
          nodes={node.children}
          selectedId={selectedId}
          onSelect={onSelect}
          forceExpanded={forceExpanded}
          showBadges={showBadges}
          equipmentIdsWithSchedule={equipmentIdsWithSchedule}
        />
      )}
    </li>
  )
}
