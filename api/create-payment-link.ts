import type { VercelRequest, VercelResponse } from '@vercel/node'

type LineItemInput = { name: string; price: number; quantity: number }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const accessToken = process.env.SQUARE_ACCESS_TOKEN
    const locationId = process.env.SQUARE_LOCATION_ID
    const isSandbox =
      String(process.env.SQUARE_ENVIRONMENT || '').toLowerCase() === 'sandbox'
    const squareHost = isSandbox ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com'

    if (!accessToken || !locationId) {
      return res.status(500).json({ error: 'Square環境変数（SQUARE_ACCESS_TOKEN / SQUARE_LOCATION_ID）が未設定です。' })
    }

    const { items, note } = (req.body || {}) as { items?: LineItemInput[]; note?: string }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '商品（items）が必要です。' })
    }

    const normalized: LineItemInput[] = []
    for (const item of items) {
      const name = typeof item.name === 'string' ? item.name.trim() : ''
      const price = Number(item.price)
      const quantity = Number(item.quantity)
      if (!name || !Number.isInteger(price) || price <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ error: '商品名・単価（円・正の整数）・数量（正の整数）を確認してください。' })
      }
      normalized.push({ name, price, quantity })
    }

    const lineItems = normalized.map((item) => ({
      name: item.name,
      quantity: String(item.quantity),
      base_price_money: {
        amount: item.price,
        currency: 'JPY',
      },
    }))

    const response = await fetch(`${squareHost}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers: {
        'Square-Version': '2026-01-22',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        payment_note: note ?? '',
        order: {
          location_id: locationId,
          line_items: lineItems,
        },
      }),
    })

    const data = (await response.json()) as {
      errors?: unknown
      payment_link?: { url?: string; order_id?: string }
    }

    if (!response.ok) {
      return res.status(500).json({ error: data.errors ?? 'Square API error' })
    }

    const url = data.payment_link?.url
    const orderId = data.payment_link?.order_id
    if (!url || !orderId) {
      return res.status(500).json({ error: 'Squareの応答に url / order_id がありません。', details: data })
    }

    return res.status(200).json({ url, orderId })
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to create Square payment link',
      details: error instanceof Error ? error.message : 'unknown error',
    })
  }
}
