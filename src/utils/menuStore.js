import { menuItems as defaultMenuItems } from '../data/menuItems'
import { normalizeDisplaySection } from './menuDisplaySections'

export const MENU_KEY = 'mdy_menu_items'

export const normalizeMenuItems = (parsed) => {
  if (!Array.isArray(parsed)) return []
  return parsed.map((item) => ({
    ...item,
    description: item.description ?? '',
    category: item.category ?? 'フード',
    displaySection: normalizeDisplaySection(item.displaySection),
    imageKey: item.imageKey ?? '',
    enabled: item.enabled !== false,
    requiresReservation: item.requiresReservation === true,
    price: Number(item.price) || 0,
    name: String(item.name ?? ''),
    id: String(item.id ?? ''),
  }))
}

const cloneDefaults = () => defaultMenuItems.map((item) => ({ ...item }))

export const loadMenuItems = () => {
  try {
    const raw = localStorage.getItem(MENU_KEY)
    if (!raw) return cloneDefaults()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return cloneDefaults()
    return normalizeMenuItems(parsed)
  } catch {
    return cloneDefaults()
  }
}

export const saveMenuItems = (items) => {
  localStorage.setItem(MENU_KEY, JSON.stringify(items))
}

const noStoreFetch = (input, init = {}) =>
  fetch(input, { ...init, cache: 'no-store' })

export const fetchMenuFromServer = async () => {
  const response = await noStoreFetch('/api/menu')
  if (!response.ok) throw new Error('Failed to fetch menu')
  const data = await response.json()
  const items = Array.isArray(data.items) ? normalizeMenuItems(data.items) : cloneDefaults()
  saveMenuItems(items)
  return items
}

export const syncMenuToServer = async (items) => {
  const response = await noStoreFetch('/api/menu', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  })
  if (!response.ok) {
    let detail = ''
    try {
      const data = await response.json()
      detail = data?.details || data?.error || ''
    } catch {
      // noop
    }
    throw new Error(detail || 'Failed to save menu')
  }
  const data = await response.json()
  const next = Array.isArray(data.items) ? normalizeMenuItems(data.items) : normalizeMenuItems(items)
  saveMenuItems(next)
  return next
}
