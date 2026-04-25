type PushOrder = {
  id?: string
  storeName?: string
  lineName?: string
  total?: number
  address?: string
  cashbackAmount?: number
}

const toYen = (value: unknown) => `¥${Number(value || 0).toLocaleString('ja-JP')}`

const buildMessage = (order: PushOrder) =>
  [
    `新規注文: ${order.storeName || '-'} / ${order.lineName || '-'}`,
    `合計: ${toYen(order.total)}`,
    `住所: ${order.address || '-'}`,
    `還元: ${toYen(order.cashbackAmount)}`,
  ].join('\n')

export const sendOrderPushNotification = async (order: PushOrder) => {
  const appToken = process.env.PUSHOVER_APP_TOKEN
  const userKey = process.env.PUSHOVER_USER_KEY
  if (!appToken || !userKey) return { skipped: true as const }

  const response = await fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      token: appToken,
      user: userKey,
      title: `注文受信 ${order.id || ''}`.trim(),
      message: buildMessage(order),
      priority: '1',
      sound: 'gamelan',
      url: process.env.PUSHOVER_OPEN_URL || 'https://mdy.kranz.design/admin',
      url_title: '注文管理を開く',
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Failed to send push notification: ${response.status} ${detail}`)
  }

  return { skipped: false as const }
}
