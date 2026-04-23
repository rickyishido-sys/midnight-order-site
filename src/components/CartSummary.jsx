const toYen = (value) => `¥${value.toLocaleString()}`

function CartSummary({
  cartItems,
  subtotal,
  deliveryFee,
  total,
  minimumOrder,
  customerBack,
  error,
}) {
  const shortage = Math.max(0, minimumOrder - subtotal)
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <section className="summary glass-gold">
      <div className="section-head">
        <p className="section-eyebrow">ORDER SUMMARY</p>
        <p className="section-title">注文内容</p>
      </div>

      {cartItems.length === 0 ? (
        <p className="empty">商品がまだ選択されていません。</p>
      ) : (
        <ul className="summary-list">
          {cartItems.map((item) => (
            <li key={item.id}>
              <span>{item.name} ×{item.quantity}</span>
              <span>{toYen(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="summary-row">
        <span>商品小計（{itemCount}点）</span>
        <span>{toYen(subtotal)}</span>
      </div>

      <div className="summary-row">
        <span>配達料</span>
        <span>{toYen(deliveryFee)}</span>
      </div>

      <div className="total-row">
        <span>合計</span>
        <strong>{toYen(total)}</strong>
      </div>

      <div className="info-grid">
        <p className="minimum">最低注文：{toYen(minimumOrder)}</p>
        <p className="back">発注者バック：{toYen(customerBack)}/件</p>
      </div>

      {subtotal < minimumOrder && (
        <p className="error">
          {error || `最低注文金額まであと${toYen(shortage)}必要です。`}
        </p>
      )}
    </section>
  )
}

export default CartSummary
