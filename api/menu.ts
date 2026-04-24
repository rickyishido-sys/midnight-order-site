import type { VercelRequest, VercelResponse } from '@vercel/node'
import { menuItems as defaultMenuItems } from '../src/data/menuItems.js'
import { normalizeMenuItems } from '../src/utils/menuStore.js'
import { applyNoStoreJson } from './_lib/cacheHeaders.js'
import { readMenuFromKv, writeMenuToKv } from './_lib/kvStore.js'

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
