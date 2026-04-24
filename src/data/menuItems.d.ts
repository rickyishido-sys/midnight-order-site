export type DefaultMenuItem = {
  id: string
  name: string
  price: number
  description?: string
  category?: string
  /** 注文・メニュー画面の見出し（カリッと / さっぱりと / 〆に / ひと皿で / 盛り合わせ） */
  displaySection?: string
  imageKey?: string
  enabled?: boolean
  requiresReservation?: boolean
}

export const menuItems: DefaultMenuItem[]
