type OrderLike = {
  id?: string
  storeName?: string
  lineName?: string
  total?: number
  address?: string
}

const toYen = (value: unknown) => `¥${Number(value || 0).toLocaleString('ja-JP')}`

const buildMessage = (order: OrderLike, adminUrl: string) =>
  [
    '【新規注文】',
    `注文ID: ${order.id || '-'}`,
    `お届け先: ${order.storeName || '-'}`,
    `発注者LINE名: ${order.lineName || '-'}`,
    `合計: ${toYen(order.total)}`,
    `住所: ${order.address || '-'}`,
    '',
    `配達管理ダッシュボード: ${adminUrl}`,
  ].join('\n')

export const sendOrderLineNotification = async (order: OrderLike) => {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
  const to = process.env.LINE_NOTIFY_TO
  const adminUrl = process.env.LINE_NOTIFY_ADMIN_URL || 'https://mdy.kranz.design/admin'
  if (!accessToken || !to) return { skipped: true as const }

  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      messages: [
        {
          type: 'text',
          text: buildMessage(order, adminUrl),
        },
      ],
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Failed to send LINE notification: ${response.status} ${detail}`)
  }

  return { skipped: false as const }
}
