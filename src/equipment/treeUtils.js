// Shared by EquipmentsPage and any other page that needs to display the same equipment tree
// (e.g. ShiftsCalendarPage) - keeps the tree-building/filtering logic identical everywhere.
export function buildTree(items) {
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
