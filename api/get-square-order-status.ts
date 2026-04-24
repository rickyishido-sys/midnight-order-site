import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyNoStoreJson } from './_lib/cacheHeaders.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyNoStoreJson(res)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const accessToken = process.env.SQUARE_ACCESS_TOKEN
  const isSandbox = String(process.env.SQUARE_ENVIRONMENT || '').toLowerCase() === 'sandbox'
  const squareHost = isSandbox ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com'
  if (!accessToken) {
    return res.status(500).json({ error: 'SQUARE_ACCESS_TOKEN is not set' })
  }

  const squareOrderId = String(req.query.squareOrderId || '').trim()
  if (!squareOrderId) {
    return res.status(400).json({ error: 'squareOrderId is required' })
  }

  try {
    const response = await fetch(`${squareHost}/v2/orders/${encodeURIComponent(squareOrderId)}`, {
      method: 'GET',
      headers: {
        'Square-Version': '2026-01-22',
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const data = (await response.json()) as {
      errors?: unknown
      order?: { state?: string; tenders?: Array<{ id?: string }> }
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Square API error',
        details: data.errors ?? data,
      })
    }

    const state = data.order?.state || ''
    const paid = state === 'COMPLETED'
    return res.status(200).json({
      paid,
      state,
      tenderCount: Array.isArray(data.order?.tenders) ? data.order.tenders.length : 0,
    })
  } catch {
    return res.status(500).json({ error: 'Failed to fetch order status' })
  }
}
