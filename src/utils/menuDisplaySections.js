/** 注文・本日メニューでの見出し順（管理画面プルダウンと一致） */
export const DISPLAY_SECTION_ORDER = ['カリッと', 'さっぱりと', '〆に', 'ひと皿で', '盛り合わせ']

export const DISPLAY_SECTION_OPTIONS = DISPLAY_SECTION_ORDER.map((value) => ({
  value,
  label: value,
}))

export function normalizeDisplaySection(raw) {
  const s = String(raw ?? '').trim()
  if (DISPLAY_SECTION_ORDER.includes(s)) return s
  return 'カリッと'
}

/**
 * @param {Array<{ displaySection?: string }>} items
 * @returns {Array<{ section: string, items: typeof items }>}
 */
export function groupMenuItemsByDisplaySection(items) {
  if (!Array.isArray(items) || items.length === 0) return []
  const buckets = new Map()
  for (const item of items) {
    const section = normalizeDisplaySection(item.displaySection)
    if (!buckets.has(section)) buckets.set(section, [])
    buckets.get(section).push(item)
  }
  const keys = [...buckets.keys()].sort((a, b) => {
    const ia = DISPLAY_SECTION_ORDER.indexOf(a)
    const ib = DISPLAY_SECTION_ORDER.indexOf(b)
    const unknownA = ia === -1
    const unknownB = ib === -1
    if (!unknownA && !unknownB && ia !== ib) return ia - ib
    if (!unknownA && unknownB) return -1
    if (unknownA && !unknownB) return 1
    return a.localeCompare(b, 'ja')
  })
  return keys.map((section) => ({
    section,
    items: buckets.get(section) || [],
  }))
}
