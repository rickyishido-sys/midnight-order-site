import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHmac, timingSafeEqual } from 'node:crypto'
import {
  patchOrderInKv,
  readOrdersFromKv,
  upsertCashbackEntryInKv,
} from './_lib/kvStore.js'

type SquareEvent = {
  type?: string
  event_id?: string
  created_at?: string
  data?: {
    id?: string
    object?: {
      payment?: { id?: string; order_id?: string; status?: string }
      order?: { id?: string; state?: string }
    }
  }
}

const getHeader = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

const readRawBody = async (req: VercelRequest) => {
  if (typeof req.body === 'string') return req.body
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body)

  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

const buildNotificationUrl = (req: VercelRequest) => {
  const proto = getHeader(req.headers['x-forwarded-proto']) || 'https'
  const host = getHeader(req.headers['x-forwarded-host']) || getHeader(req.headers.host) || 'mdy.kranz.design'
  const path = req.url || '/api/square-webhook'
  return `${proto}://${host}${path}`
}

const verifySignature = ({
  signatureKey,
  notificationUrl,
  body,
  signatureHeader,
}: {
  signatureKey: string
  notificationUrl: string
  body: string
  signatureHeader: string
}) => {
  const expected = createHmac('sha256', signatureKey).update(notificationUrl + body).digest('base64')
  const expectedBuf = Buffer.from(expected, 'utf8')
  const receivedBuf = Buffer.from(signatureHeader, 'utf8')
  if (expectedBuf.length !== receivedBuf.length) return false
  return timingSafeEqual(expectedBuf, receivedBuf)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
  if (!signatureKey) {
    return res.status(500).json({ error: 'SQUARE_WEBHOOK_SIGNATURE_KEY is not set' })
  }

  const signatureHeader = getHeader(req.headers['x-square-hmacsha256-signature'])
  if (!signatureHeader) {
    return res.status(401).json({ error: 'Missing Square signature header' })
  }

  const rawBody = await readRawBody(req)
  const notificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL || buildNotificationUrl(req)
  const isValid = verifySignature({
    signatureKey,
    notificationUrl,
    body: rawBody,
    signatureHeader,
  })

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  let payload: SquareEvent
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return res.status(400).json({ error: 'Invalid JSON payload' })
  }

  const type = payload.type || 'unknown'
  const payment = payload.data?.object?.payment
  const order = payload.data?.object?.order

  if (type === 'payment.updated' || type === 'order.updated') {
    console.log(
      JSON.stringify({
        source: 'square-webhook',
        eventType: type,
        eventId: payload.event_id,
        createdAt: payload.created_at,
        paymentId: payment?.id,
        paymentOrderId: payment?.order_id,
        paymentStatus: payment?.status,
        orderId: order?.id,
        orderState: order?.state,
      }),
    )
  }

  if (type === 'payment.updated' && payment?.status === 'COMPLETED') {
    const orders = await readOrdersFromKv()
    const matched = orders.find((item) => String((item as { squareOrderId?: string }).squareOrderId || '') === String(payment.order_id || ''))
    if (matched) {
      const id = String((matched as { id?: string }).id || '')
      if (id) {
        const patched = await patchOrderInKv(id, {
          paymentStatus: 'paid',
          paymentPaidAt: new Date().toISOString(),
          squarePaymentId: payment.id || '',
        })
        if (patched) {
          const cashbackAmount = Number((patched as { cashbackAmount?: number }).cashbackAmount || 0)
          if (cashbackAmount > 0) {
            await upsertCashbackEntryInKv({
              id,
              date:
                String((patched as { createdAt?: string }).createdAt || '').slice(0, 10) ||
                new Date().toISOString().slice(0, 10),
              items: Array.isArray((patched as { items?: unknown[] }).items)
                ? ((patched as { items?: Array<{ name?: string; quantity?: number }> }).items || []).map(
                    (item) => `${item.name || ''}×${item.quantity || 0}`,
                  )
                : [],
              total: Number((patched as { total?: number }).total || 0),
              cashback: cashbackAmount,
            })
          }
        }
      }
    }
  }

  return res.status(200).json({ ok: true })
}
