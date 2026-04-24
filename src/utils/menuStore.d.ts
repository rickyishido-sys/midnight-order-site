import type { DefaultMenuItem } from '../data/menuItems'

export const MENU_KEY: string

export type MenuItemRow = DefaultMenuItem & {
  description: string
  category: string
  displaySection: string
  imageKey: string
  enabled: boolean
  requiresReservation: boolean
  price: number
  name: string
  id: string
}

export function normalizeMenuItems(parsed: unknown): MenuItemRow[]

export function loadMenuItems(): MenuItemRow[]

export function saveMenuItems(items: MenuItemRow[]): void

export function fetchMenuFromServer(): Promise<MenuItemRow[]>

export function syncMenuToServer(items: MenuItemRow[]): Promise<MenuItemRow[]>
