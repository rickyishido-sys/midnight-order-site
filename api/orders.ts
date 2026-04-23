import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  patchOrderInKv,
  readOrdersFromKv,
  upsertOrderInKv,
  writeOrdersToKv,
} from './_lib/kvStore.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const orders = await readOrdersFromKv()
      return res.status(200).json({ orders })
    }

    if (req.method === 'POST') {
      const { order } = req.body || {}
      if (!order || !order.id) {
        return res.status(400).json({ error: 'order.id is required' })
      }
      const orders = await upsertOrderInKv(order)
      return res.status(200).json({ ok: true, orders })
    }

    if (req.method === 'PATCH') {
      const { id, patch } = req.body || {}
      if (!id || !patch || typeof patch !== 'object') {
        return res.status(400).json({ error: 'id and patch are required' })
      }
      const updated = await patchOrderInKv(String(id), patch)
      if (!updated) return res.status(404).json({ error: 'order not found' })
      return res.status(200).json({ ok: true, order: updated })
    }

    if (req.method === 'PUT') {
      const { orders } = req.body || {}
      if (!Array.isArray(orders)) {
        return res.status(400).json({ error: 'orders array is required' })
      }
      await writeOrdersToKv(orders)
      return res.status(200).json({ ok: true, orders })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to handle orders',
      details: error instanceof Error ? error.message : 'unknown error',
    })
  }
}
