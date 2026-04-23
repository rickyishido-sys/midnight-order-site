import { menuItems as defaultMenuItems } from '../data/menuItems'

export const MENU_KEY = 'mdy_menu_items'

export const loadMenuItems = () => {
  try {
    const raw = localStorage.getItem(MENU_KEY)
    if (!raw) return defaultMenuItems
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return defaultMenuItems
    return parsed.map((item) => ({
      ...item,
      description: item.description ?? '',
      category: item.category ?? 'フード',
      imageKey: item.imageKey ?? '',
      enabled: item.enabled !== false,
    }))
  } catch {
    return defaultMenuItems
  }
}

export const saveMenuItems = (items) => {
  localStorage.setItem(MENU_KEY, JSON.stringify(items))
}
