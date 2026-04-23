const toYen = (value) => `¥${value.toLocaleString()}`

function OrderButton({ canOrder, subtotal, total, minimumOrder, onOrder }) {
  const label = canOrder
    ? `LINEで注文する（${toYen(total)}）`
    : `あと${toYen(Math.max(0, minimumOrder - subtotal))}で注文可能`

  return (
    <div className="order-sticky-wrap">
      <button className="order-button btn-gold" type="button" disabled={!canOrder} onClick={onOrder}>
        {label}
      </button>
    </div>
  )
}

export default OrderButton
