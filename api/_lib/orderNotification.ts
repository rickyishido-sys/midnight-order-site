type OrderLike = {
  id?: string
  createdAt?: string
  storeName?: string
  lineName?: string
  zipCode?: string
  address?: string
  note?: string
  total?: number
  subtotal?: number
  deliveryFee?: number
  cashbackAmount?: number
  cashbackMethod?: string
  cashbackReceiver?: string
  paymentMethod?: string
  items?: Array<{ name?: string; quantity?: number; price?: number }>
}

const toYen = (value: unknown) => `¥${Number(value || 0).toLocaleString('ja-JP')}`

const paymentLabel = (paymentMethod?: string) =>
  paymentMethod === 'square' ? 'オンライン決済' : '現地払い'

const cashbackLabel = (cashbackMethod?: string) => {
  if (cashbackMethod === 'paypay') return 'PayPay送金'
  if (cashbackMethod === 'bank') return '銀行振込'
  return '次回値引き'
}

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const buildText = (order: OrderLike) => {
  const itemLines = Array.isArray(order.items)
    ? order.items.map((item) => `- ${item.name || '商品'} x${Number(item.quantity || 0)} (${toYen(item.price)})`)
    : []

  return [
    '新規注文を受信しました',
    '',
    `注文ID: ${order.id || '-'}`,
    `注文時刻: ${order.createdAt || '-'}`,
    `店名: ${order.storeName || '-'}`,
    `発注者LINE名: ${order.lineName || '-'}`,
    `郵便番号: ${order.zipCode || '-'}`,
    `住所: ${order.address || '-'}`,
    `決済方法: ${paymentLabel(order.paymentMethod)}`,
    `キャッシュバック: ${toYen(order.cashbackAmount)} / ${cashbackLabel(order.cashbackMethod)}`,
    order.cashbackReceiver ? `受取先: ${order.cashbackReceiver}` : null,
    `商品小計: ${toYen(order.subtotal)}`,
    `配達料: ${toYen(order.deliveryFee)}`,
    `合計: ${toYen(order.total)}`,
    '',
    '注文内容:',
    ...itemLines,
    '',
    `備考: ${order.note || 'なし'}`,
  ]
    .filter(Boolean)
    .join('\n')
}

const buildHtml = (text: string) =>
  `<pre style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; line-height: 1.5;">${escapeHtml(text)}</pre>`

export const sendOrderNotification = async (order: OrderLike) => {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.ORDER_NOTIFY_TO
  const from = process.env.ORDER_NOTIFY_FROM || 'onboarding@resend.dev'

  if (!apiKey || !to) return { skipped: true as const }

  const text = buildText(order)
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `【新規注文】${order.storeName || '-'} / ${order.id || '-'}`,
      text,
      html: buildHtml(text),
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Failed to send order email: ${response.status} ${detail}`)
  }

  return { skipped: false as const }
}
