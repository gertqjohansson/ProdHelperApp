import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function EquipmentTree({ nodes, selectedId, onSelect, forceExpanded }) {
  return (
    <ul className="equipment-tree">
      {nodes.map((node) => (
        <EquipmentTreeItem key={node.id} node={node} selectedId={selectedId} onSelect={onSelect} forceExpanded={forceExpanded} />
      ))}
    </ul>
  )
}

function EquipmentTreeItem({ node, selectedId, onSelect, forceExpanded }) {
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
      </div>
      {showChildren && (
        <EquipmentTree nodes={node.children} selectedId={selectedId} onSelect={onSelect} forceExpanded={forceExpanded} />
      )}
    </li>
  )
}
