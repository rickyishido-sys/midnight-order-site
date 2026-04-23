import { useEffect, useMemo, useState } from 'react'
import { fetchOrdersFromServer, loadOrders, patchOrderToServer, saveOrders } from '../utils/adminOrders'
import { loadMenuItems, saveMenuItems } from '../utils/menuStore'
import MenuEditor from './MenuEditor'
import PaymentLinkGenerator from './PaymentLinkGenerator'

const toYen = (value) => `¥${Number(value || 0).toLocaleString()}`
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1122'

function AdminPage() {
  const [pin, setPin] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [orders, setOrders] = useState(loadOrders)
  const [menuItems, setMenuItems] = useState(loadMenuItems)

  useEffect(() => {
    fetchOrdersFromServer()
      .then((serverOrders) => setOrders(serverOrders))
      .catch(() => {})
  }, [])

  const stats = useMemo(() => {
    const totalOrders = orders.length
    const delivered = orders.filter((order) => order.deliveryStatus === 'delivered').length
    const outForDelivery = orders.filter((order) => order.deliveryStatus === 'out_for_delivery').length
    const ordered = orders.filter((order) => order.deliveryStatus === 'ordered').length
    const pending = orders.filter((order) => order.deliveryStatus !== 'delivered').length
    const cashbackPending = orders.filter((order) => order.cashbackStatus === 'pending').length
    const cashbackPaidTotal = orders
      .filter((order) => order.cashbackStatus === 'paid')
      .reduce((sum, order) => sum + Number(order.cashbackAmount || 0), 0)
    const deliveredSales = orders
      .filter((order) => order.deliveryStatus === 'delivered')
      .reduce((sum, order) => sum + Number(order.total || 0), 0)
    return {
      totalOrders,
      delivered,
      outForDelivery,
      ordered,
      pending,
      cashbackPending,
      cashbackPaidTotal,
      deliveredSales,
    }
  }, [orders])

  const authorize = () => {
    if (pin === ADMIN_PIN) {
      setAuthorized(true)
    } else {
      alert('PINが違います。')
    }
  }

  const updateOrder = async (id, nextValues) => {
    const nextOrders = orders.map((order) =>
      order.id === id
        ? {
            ...order,
            ...nextValues,
          }
        : order,
    )
    setOrders(nextOrders)
    saveOrders(nextOrders)
    patchOrderToServer(id, nextValues).catch(() => {})
  }

  const markOutForDelivery = (id) => {
    updateOrder(id, { deliveryStatus: 'out_for_delivery' })
  }

  const markDeliveredAndCashback = (id) => {
    updateOrder(id, {
      deliveryStatus: 'delivered',
      deliveredAt: new Date().toISOString(),
      cashbackStatus: 'paid',
      cashbackPaidAt: new Date().toISOString(),
    })
  }

  const syncMenu = (nextItems) => {
    setMenuItems(nextItems)
    saveMenuItems(nextItems)
  }

  const addMenuItem = (item) => syncMenu([...menuItems, item])

  const updateMenuItem = (id, key, value) => {
    const nextItems = menuItems.map((item) =>
      item.id === id
        ? {
            ...item,
            [key]: value,
          }
        : item,
    )
    syncMenu(nextItems)
  }

  const removeMenuItem = (id) => {
    const nextItems = menuItems.filter((item) => item.id !== id)
    syncMenu(nextItems)
  }

  const moveMenuItem = (id, direction) => {
    const currentIndex = menuItems.findIndex((item) => item.id === id)
    const targetIndex = currentIndex + direction
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= menuItems.length) return
    const nextItems = [...menuItems]
    const [picked] = nextItems.splice(currentIndex, 1)
    nextItems.splice(targetIndex, 0, picked)
    syncMenu(nextItems)
  }

  const clearMenuItems = () => {
    if (!window.confirm('本当にメニューを全削除しますか？')) return
    syncMenu([])
  }

  if (!authorized) {
    return (
      <main className="admin-page">
        <section className="admin-login glass">
          <h1>管理画面ログイン</h1>
          <p>配達完了とキャッシュバック処理を行います。</p>
          <input
            type="password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="管理PIN"
          />
          <button className="btn-gold" type="button" onClick={authorize}>
            ログイン
          </button>
          <a href="/">LPへ戻る</a>
        </section>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <header className="admin-header glass-gold">
        <h1>配達管理ダッシュボード</h1>
        <a href="/order" target="_blank" rel="noreferrer">
          注文ページへ
        </a>
      </header>

      <section className="admin-stats">
        <article className="glass">
          <p>総注文数</p>
          <strong>{stats.totalOrders}件</strong>
        </article>
        <article className="glass">
          <p>未完了</p>
          <strong>{stats.pending}件</strong>
        </article>
        <article className="glass">
          <p>配達完了</p>
          <strong>{stats.delivered}件</strong>
        </article>
        <article className="glass">
          <p>還元待ち</p>
          <strong>{stats.cashbackPending}件</strong>
        </article>
        <article className="glass">
          <p>還元合計</p>
          <strong>{toYen(stats.cashbackPaidTotal)}</strong>
        </article>
        <article className="glass">
          <p>売上合計（配達完了）</p>
          <strong>{toYen(stats.deliveredSales)}</strong>
        </article>
        <article className="glass">
          <p>受付/配達中</p>
          <strong>
            {stats.ordered}件 / {stats.outForDelivery}件
          </strong>
        </article>
      </section>

      <MenuEditor
        menuItems={menuItems}
        onAdd={addMenuItem}
        onUpdate={updateMenuItem}
        onDelete={removeMenuItem}
        onMove={moveMenuItem}
        onClear={clearMenuItems}
      />

      <PaymentLinkGenerator menuItems={menuItems} />

      <section className="admin-orders">
        {orders.length === 0 && <p className="glass admin-empty">注文データがまだありません。</p>}
        {orders.map((order) => (
          <article className="glass admin-card" key={order.id}>
            <div className="admin-card-head">
              <div>
                <p className="admin-order-id">{order.id}</p>
                <p className="admin-order-meta">
                  {order.storeName} / {order.lineName}
                </p>
              </div>
              <span className={`admin-status admin-status-${order.deliveryStatus}`}>
                {order.deliveryStatus === 'delivered'
                  ? '配達完了'
                  : order.deliveryStatus === 'out_for_delivery'
                    ? '配達中'
                    : '受付済み'}
              </span>
            </div>

            <p className="admin-address">
              〒{order.zipCode || '---'} {order.address || '住所未入力'}
            </p>
            <p className="admin-total">
              合計 {toYen(order.total)} / 還元 {toYen(order.cashbackAmount)}
            </p>
            <p className="admin-meta-line">
              決済: {order.paymentMethod === 'square' ? 'オンライン決済' : '現地払い'} / 還元受取:{' '}
              {order.cashbackMethod === 'paypay'
                ? 'PayPay'
                : order.cashbackMethod === 'bank'
                  ? '銀行振込'
                  : '次回値引き'}
            </p>
            {order.cashbackReceiver ? (
              <p className="admin-meta-line">受取先: {order.cashbackReceiver}</p>
            ) : null}

            <div className="admin-actions">
              {order.deliveryStatus === 'ordered' && (
                <button type="button" onClick={() => markOutForDelivery(order.id)}>
                  配達中に変更
                </button>
              )}
              {order.deliveryStatus !== 'delivered' && (
                <button type="button" className="btn-gold" onClick={() => markDeliveredAndCashback(order.id)}>
                  配達完了 + 還元実行
                </button>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

export default AdminPage
