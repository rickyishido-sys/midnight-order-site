import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyNoStoreJson } from './_lib/cacheHeaders.js'
import {
  patchOrderInKv,
  readOrdersFromKv,
  readStoreStatusFromKv,
  upsertOrderInKv,
  writeOrdersToKv,
} from './_lib/kvStore.js'
import { sendOrderNotification } from './_lib/orderNotification.js'
import { sendOrderPushNotification } from './_lib/orderPushNotification.js'
import { sendOrderLineNotification } from './_lib/orderLineNotification.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyNoStoreJson(res)
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
      const currentOrders = await readOrdersFromKv()
      const isNewOrder = !currentOrders.some((item) => String((item as { id?: string }).id || '') === String(order.id))
      if (isNewOrder) {
        const status = await readStoreStatusFromKv()
        if (status?.isClosed) {
          return res.status(403).json({ error: 'Store is closed today' })
        }
      }
      const orders = await upsertOrderInKv(order)
      let mailNotice: 'sent' | 'skipped' | 'failed' = 'skipped'
      let pushNotice: 'sent' | 'skipped' | 'failed' = 'skipped'
      let lineNotice: 'sent' | 'skipped' | 'failed' = 'skipped'
      if (isNewOrder) {
        try {
          const result = await sendOrderNotification(order)
          mailNotice = result.skipped ? 'skipped' : 'sent'
        } catch (error) {
          console.error('[orders] email notify failed', error)
          mailNotice = 'failed'
        }
        try {
          const result = await sendOrderPushNotification(order)
          pushNotice = result.skipped ? 'skipped' : 'sent'
        } catch (error) {
          console.error('[orders] push notify failed', error)
          pushNotice = 'failed'
        }
        try {
          const result = await sendOrderLineNotification(order)
          lineNotice = result.skipped ? 'skipped' : 'sent'
        } catch (error) {
          console.error('[orders] line notify failed', error)
          lineNotice = 'failed'
        }
      }
      return res.status(200).json({ ok: true, orders, mailNotice, pushNotice, lineNotice })
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
