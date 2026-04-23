/* global process */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const accessToken = process.env.SQUARE_ACCESS_TOKEN
  const locationId = process.env.SQUARE_LOCATION_ID

  if (!accessToken || !locationId) {
    return res.status(500).json({ error: 'Square環境変数が未設定です。' })
  }

  const { orderId, total, note } = req.body || {}
  const amount = Number(total)

  if (!orderId || Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: '注文情報が不正です。' })
  }

  const idempotencyKey = `checkout-${orderId}`
  const amountMoney = Math.round(amount)

  try {
    const squareResponse = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
      method: 'POST',
      headers: {
        'Square-Version': '2025-10-16',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        quick_pay: {
          name: `OHACO ${orderId}`,
          price_money: {
            amount: amountMoney,
            currency: 'JPY',
          },
          location_id: locationId,
        },
        checkout_options: {
          redirect_url: `${req.headers.origin || 'https://mdy.kranz.design'}/order?payment=success&orderId=${encodeURIComponent(orderId)}`,
        },
        pre_populated_data: {
          buyer_email: '',
        },
        description: note || '',
      }),
    })

    const data = await squareResponse.json()
    if (!squareResponse.ok) {
      return res.status(squareResponse.status).json({
        error: 'Square API error',
        details: data,
      })
    }

    return res.status(200).json({
      id: data.payment_link?.id,
      url: data.payment_link?.url,
      squareOrderId: data.payment_link?.order_id,
    })
  } catch {
    return res.status(500).json({ error: 'Square連携中にエラーが発生しました。' })
  }
}
