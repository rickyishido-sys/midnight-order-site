export const createSquarePaymentLink = async ({ orderId, total, note }) => {
  const response = await fetch('/api/create-square-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, total, note }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Square決済リンクの作成に失敗しました。')
  }

  const data = await response.json()
  if (!data.url) {
    throw new Error('Square決済URLが取得できませんでした。')
  }
  return {
    url: data.url,
    paymentLinkId: data.id || '',
    squareOrderId: data.squareOrderId || '',
  }
}
