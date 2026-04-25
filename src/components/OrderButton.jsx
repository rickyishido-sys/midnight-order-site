const toYen = (value) => `¥${value.toLocaleString()}`

function OrderButton({
  canOrder,
  subtotal,
  total,
  minimumOrder,
  onOrder,
  submitting = false,
  storeClosed = false,
}) {
  const label = submitting
    ? '送信中...'
    : storeClosed
      ? '本日は定休日です'
    : canOrder
      ? `LINEで注文する（${toYen(total)}）`
      : `あと${toYen(Math.max(0, minimumOrder - subtotal))}で注文可能`

  return (
    <div className="order-sticky-wrap">
      <button className="order-button btn-gold" type="button" disabled={!canOrder || submitting} onClick={onOrder}>
        {label}
      </button>
    </div>
  )
}

export default OrderButton
