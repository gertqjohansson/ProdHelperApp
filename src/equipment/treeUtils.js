// Shared by EquipmentsPage and any other page that needs to display the same equipment tree
// (e.g. ShiftsCalendarPage) - keeps the tree-building/filtering logic identical everywhere.
export function buildTree(items, getParentId = (item) => item.parentId ?? null) {
  const byParent = new Map()
  for (const item of items) {
    const parentId = getParentId(item)
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

// Flattens a tree (as produced by buildTree) into a depth-first list of { id, name, depth},
// skipping the subtree rooted at excludeId entirely - used by the "move to" parent picker so an
// item (and therefore all its descendants) can never be offered as its own new parent, which
// would create a cycle.
export function flattenTreeExcluding(nodes, excludeId, depth = 0, acc = []) {
  for (const node of nodes) {
    if (node.id === excludeId) continue
    acc.push({ id: node.id, name: node.name, depth })
    flattenTreeExcluding(node.children, excludeId, depth + 1, acc)
  }
  return acc
}

export function filterTree(nodes, filterText) {
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
