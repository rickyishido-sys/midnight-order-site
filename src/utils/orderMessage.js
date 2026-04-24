const toYen = (value) => `¥${value.toLocaleString()}`

export const buildOrderMessage = ({
  storeName,
  lineName,
  zipCode,
  address,
  note,
  cartItems,
  subtotal,
  deliveryFee,
  total,
  customerBack,
  paymentMethod,
  cashbackMethod,
  cashbackReceiver,
}) => {
  const itemLines = cartItems.map((item) => {
    const tag = item.requiresReservation ? '（要予約・前日16時まで）' : ''
    return `・${item.name}${tag} ×${item.quantity} = ${toYen(item.price * item.quantity)}`
  })

  return [
    '【深夜配達 注文】',
    `店名：${storeName || '未入力'}`,
    `発注者LINE名：${lineName || '未入力'}`,
    `郵便番号：${zipCode || '未入力'}`,
    `住所：${address || '未入力'}`,
    '',
    '注文内容：',
    ...itemLines,
    '',
    `商品小計：${toYen(subtotal)}`,
    `配達料：${toYen(deliveryFee)}`,
    `合計：${toYen(total)}`,
    `決済方法：${paymentMethod || '現地払い'}`,
    `キャッシュバック受取：${cashbackMethod || '次回値引き'}`,
    cashbackReceiver ? `受取先情報：${cashbackReceiver}` : null,
    `発注者バック対象：${toYen(customerBack)}/件`,
    `備考：${note || 'なし'}`,
  ]
    .filter(Boolean)
    .join('\n')
}
