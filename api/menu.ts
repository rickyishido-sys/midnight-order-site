import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyNoStoreJson } from './_lib/cacheHeaders.js'
import { readMenuFromKv, writeMenuToKv } from './_lib/kvStore.js'

const DISPLAY_SECTIONS = ['カリッと', 'さっぱりと', '〆に', 'ひと皿で', '盛り合わせ']
const normalizeDisplaySection = (value: unknown) => {
  const text = String(value ?? '').trim()
  return DISPLAY_SECTIONS.includes(text) ? text : 'カリッと'
}

const normalizeMenuItems = (parsed: unknown) => {
  if (!Array.isArray(parsed)) return []
  return parsed.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>
    return {
      id: String(row.id ?? ''),
      name: String(row.name ?? ''),
      price: Number(row.price) || 0,
      description: String(row.description ?? ''),
      category: String(row.category ?? 'フード'),
      displaySection: normalizeDisplaySection(row.displaySection),
      imageKey: String(row.imageKey ?? ''),
      enabled: row.enabled !== false,
      requiresReservation: row.requiresReservation === true,
    }
  })
}

const defaultMenuItems = [
  { id: 'karaage-5', name: 'からあげ(5個)', price: 980, description: '定番の衣サクッと中ジューシー', category: 'フード', displaySection: 'カリッと', imageKey: 'karaage', enabled: true },
  { id: 'chicken-nugget', name: 'チキンナゲット', price: 780, description: 'ついつい手が伸びるサイド', category: 'フード', displaySection: 'カリッと', enabled: true },
  { id: 'french-fries', name: 'フライドポテト', price: 580, description: '熱々サクサク', category: 'フード', displaySection: 'カリッと', imageKey: 'fries', enabled: true },
  { id: 'kushi-katsu', name: '串カツ(2種2本ずつ)', price: 1280, description: '2種類をお楽しみください', category: 'フード', displaySection: 'カリッと', enabled: true },
  { id: 'age-mori', name: '揚物盛り合わせ', price: 2280, description: '揚げ物を一度に味わえる', category: 'フード', displaySection: '盛り合わせ', imageKey: 'snack', enabled: true },
  { id: 'asazuke-mori', name: '浅漬け盛り合わせ', price: 680, description: 'さっぱり箸休め', category: 'フード', displaySection: 'さっぱりと', enabled: true },
  { id: 'menma-chashu', name: 'ピリ辛メンマチャーシュー', price: 880, description: 'ビールにも合う一品', category: 'フード', displaySection: 'さっぱりと', enabled: true },
  { id: 'macaroni-salad', name: 'マカロニサラダ', price: 580, description: '懐かしの味わい', category: 'フード', displaySection: 'さっぱりと', enabled: true },
  { id: 'dashimaki', name: 'だし巻き玉子', price: 580, description: '出汁の香りたっぷり', category: 'フード', displaySection: 'さっぱりと', enabled: true },
  { id: 'nachos', name: 'ナチョス', price: 880, description: 'シェアにも', category: 'フード', displaySection: 'ひと皿で', enabled: true },
  { id: 'yasai-chijimi', name: '野菜チヂミ', price: 980, description: '野菜たっぷり', category: 'フード', displaySection: 'ひと皿で', enabled: true },
  { id: 'shio-yakisoba', name: '塩焼きそば', price: 1080, description: 'シンプルに旨い', category: 'フード', displaySection: '〆に', enabled: true },
  { id: 'taco-rice', name: 'タコライス', price: 1180, description: 'スパイスの香り', category: 'フード', displaySection: '〆に', enabled: true },
  { id: 'tamago-chahan', name: 'たまごチャーハン', price: 1080, description: 'ふんわり卵', category: 'フード', displaySection: '〆に', enabled: true },
  { id: 'onigiri-tsukemono', name: 'おにぎりお漬物セット', price: 780, description: '〆にちょうどよい', category: 'フード', displaySection: '〆に', imageKey: 'onigiri', enabled: true },
  { id: 'fruit-mori', name: 'フルーツ盛り合わせ', price: 1480, description: '季節の果物を盛り合わせ', category: 'フード', displaySection: '盛り合わせ', enabled: true },
]

const cloneDefaults = () => defaultMenuItems.map((item) => ({ ...item }))

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyNoStoreJson(res)
  try {
    if (req.method === 'GET') {
      let stored: unknown[] | null = null
      try {
        stored = await readMenuFromKv()
      } catch {
        stored = null
      }
      const items =
        stored === null ? normalizeMenuItems(cloneDefaults()) : normalizeMenuItems(stored)
      return res.status(200).json({ items })
    }

    if (req.method === 'PUT') {
      const { items } = req.body || {}
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'items array is required' })
      }
      const normalized = normalizeMenuItems(items)
      await writeMenuToKv(normalized)
      return res.status(200).json({ ok: true, items: normalized })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to handle menu',
      details: error instanceof Error ? error.message : 'unknown error',
    })
  }
}
