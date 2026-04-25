import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchOrdersFromServer, loadOrders, patchOrderToServer, saveOrders } from '../utils/adminOrders'
import { fetchMenuFromServer, loadMenuItems, saveMenuItems, syncMenuToServer } from '../utils/menuStore'
import {
  aggregateDailySalesForMonth,
  aggregateHourlyByOrderTime,
  aggregateProductSales,
  filterDeliveredRevenueInMonth,
  formatDayLabelJa,
  formatMonthLabelJa,
  listRecentMonthKeys,
  sumOrderTotals,
} from '../utils/adminSalesAnalytics'
import MenuEditor from './MenuEditor'
import PaymentLinkGenerator from './PaymentLinkGenerator'

const toYen = (value) => `¥${Number(value || 0).toLocaleString()}`
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1122'
const formatDateTimeJa = (value) => {
  if (!value) return '不明'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '不明'
  return d.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ADMIN_TABS = [
  { id: 'sales', label: '売上分析' },
  { id: 'menu', label: '日替わりメニュー' },
  { id: 'payment', label: '決済リンク' },
  { id: 'orders', label: '注文管理' },
]

const paymentStatusLabel = (order) => {
  if (order.paymentMethod !== 'square') {
    return { text: '現地払い', className: '' }
  }
  if (order.paymentStatus === 'paid') {
    return { text: 'オンライン決済：入金済', className: 'admin-payment-paid' }
  }
  return { text: 'オンライン決済：未入金', className: 'admin-payment-pending' }
}

function AdminPage() {
  const [pin, setPin] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [orders, setOrders] = useState(loadOrders)
  const [menuItems, setMenuItems] = useState(loadMenuItems)
  const monthOptions = useMemo(() => listRecentMonthKeys(12), [])
  const [salesMonth, setSalesMonth] = useState(() => monthOptions[0] || '')
  const [activeTab, setActiveTab] = useState('orders')
  const menuSyncTimerRef = useRef(null)
  const [frontendBundle] = useState(() => {
    if (typeof document === 'undefined') return '（不明）'
    const mod = document.querySelector('script[type="module"]')
    return mod?.getAttribute('src')?.split('/').pop() || '（不明）'
  })

  useEffect(() => {
    fetchOrdersFromServer()
      .then((serverOrders) => setOrders(serverOrders))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!authorized) return
    fetchMenuFromServer()
      .then(setMenuItems)
      .catch(() => {})
  }, [authorized])

  useEffect(
    () => () => {
      if (menuSyncTimerRef.current) {
        clearTimeout(menuSyncTimerRef.current)
      }
    },
    [],
  )

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

  const salesAnalytics = useMemo(() => {
    const monthKey = salesMonth || monthOptions[0]
    const deliveredInMonth = filterDeliveredRevenueInMonth(orders, monthKey)
    const revenue = sumOrderTotals(deliveredInMonth)
    const byProduct = aggregateProductSales(deliveredInMonth)
    const byHour = aggregateHourlyByOrderTime(deliveredInMonth)
    const byDay = aggregateDailySalesForMonth(deliveredInMonth, monthKey)
    const maxHourRevenue = Math.max(0, ...byHour.map((b) => b.revenue))
    const peakHour =
      maxHourRevenue > 0 ? byHour.find((b) => b.revenue === maxHourRevenue) ?? null : null
    return {
      monthKey,
      deliveredInMonth,
      revenue,
      byProduct,
      byHour,
      byDay,
      peakHour,
    }
  }, [orders, salesMonth, monthOptions])

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
    if (menuSyncTimerRef.current) {
      clearTimeout(menuSyncTimerRef.current)
    }
    menuSyncTimerRef.current = setTimeout(() => {
      syncMenuToServer(nextItems)
        .catch((error) => {
          console.error('[menu-sync] failed', error)
        })
    }, 800)
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

      <nav className="admin-tabs" role="tablist" aria-label="管理画面の表示切替">
        {ADMIN_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? 'admin-tab admin-tab--active' : 'admin-tab'}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'sales' ? (
      <section className="glass admin-sales" role="tabpanel" aria-label="売上分析">
        <div className="admin-sales-head">
          <h2>売上分析（月次）</h2>
          <label className="admin-sales-month-label">
            <span className="visually-hidden">対象月</span>
            <select
              className="admin-sales-month"
              value={salesAnalytics.monthKey}
              onChange={(e) => setSalesMonth(e.target.value)}
            >
              {monthOptions.map((key) => (
                <option key={key} value={key}>
                  {formatMonthLabelJa(key)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="admin-sales-note">
          月次・日別・商品別は<strong>配達完了済み</strong>の注文のみ集計し、計上する日／月は
          <strong>配達完了日</strong>（未記録の古いデータは受注日）の<strong>東京時間の暦</strong>です。
          日別は当月の全日（1日〜月末）を表示し、注文がない日は 0 件です。
          時間帯別は同じ対象月の<strong>受注時刻（東京）</strong>ごとの件数・売上です。
        </p>
        <div className="admin-sales-summary">
          <article>
            <p>{formatMonthLabelJa(salesAnalytics.monthKey)}の売上（税込・送料込の合計）</p>
            <strong>{toYen(salesAnalytics.revenue)}</strong>
          </article>
          <article>
            <p>配達完了件数（当月）</p>
            <strong>{salesAnalytics.deliveredInMonth.length}件</strong>
          </article>
          <article>
            <p>受注ピーク時間帯（売上ベース）</p>
            <strong>{salesAnalytics.peakHour ? `${salesAnalytics.peakHour.hour}時台` : '—'}</strong>
          </article>
        </div>
        <div className="admin-sales-block admin-sales-block--full">
          <h3>日別売上（計上日＝配達完了日・東京／当月の全日）</h3>
          <div className="admin-sales-table-wrap">
            <table className="admin-sales-table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th className="num">件数</th>
                  <th className="num">売上</th>
                </tr>
              </thead>
              <tbody>
                {salesAnalytics.byDay.map((row) => (
                  <tr key={row.day}>
                    <td>
                      {formatDayLabelJa(row.day)}
                      <span className="admin-sales-day-key">（{row.day}）</span>
                    </td>
                    <td className="num">{row.count}</td>
                    <td className="num">{toYen(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="admin-sales-tables">
          <div className="admin-sales-block">
            <h3>商品別売上（行小計の合計）</h3>
            <div className="admin-sales-table-wrap">
              <table className="admin-sales-table">
                <thead>
                  <tr>
                    <th>商品名</th>
                    <th className="num">数量</th>
                    <th className="num">売上</th>
                  </tr>
                </thead>
                <tbody>
                  {salesAnalytics.byProduct.length === 0 ? (
                    <tr>
                      <td colSpan={3}>該当月に配達完了した注文はありません。</td>
                    </tr>
                  ) : (
                    salesAnalytics.byProduct.map((row) => (
                      <tr key={row.name}>
                        <td>{row.name}</td>
                        <td className="num">{row.quantity}</td>
                        <td className="num">{toYen(row.revenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="admin-sales-block">
            <h3>時間帯別（受注・当月の配達完了分のみ）</h3>
            <div className="admin-sales-table-wrap">
              <table className="admin-sales-table">
                <thead>
                  <tr>
                    <th>時間帯（東京）</th>
                    <th className="num">件数</th>
                    <th className="num">売上</th>
                  </tr>
                </thead>
                <tbody>
                  {salesAnalytics.byHour.every((b) => b.count === 0) ? (
                    <tr>
                      <td colSpan={3}>該当月に配達完了した注文はありません。</td>
                    </tr>
                  ) : (
                    salesAnalytics.byHour.map((b) => (
                      <tr key={b.hour}>
                        <td>
                          {b.hour}時台
                          {salesAnalytics.peakHour &&
                          b.hour === salesAnalytics.peakHour.hour &&
                          b.revenue > 0 ? (
                            <span className="admin-sales-hour-muted"> ピーク</span>
                          ) : null}
                        </td>
                        <td className="num">{b.count}</td>
                        <td className="num">{toYen(b.revenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {activeTab === 'menu' ? (
        <div className="admin-tab-panel" role="tabpanel" aria-label="メニュー管理">
          <MenuEditor
            menuItems={menuItems}
            onAdd={addMenuItem}
            onUpdate={updateMenuItem}
            onDelete={removeMenuItem}
            onMove={moveMenuItem}
            onClear={clearMenuItems}
          />
        </div>
      ) : null}

      {activeTab === 'payment' ? (
        <div className="admin-tab-panel" role="tabpanel" aria-label="決済リンク生成">
          <PaymentLinkGenerator menuItems={menuItems} />
        </div>
      ) : null}

      {activeTab === 'orders' ? (
      <section className="admin-orders admin-tab-panel" role="tabpanel" aria-label="注文管理">
        {orders.length === 0 && <p className="glass admin-empty">注文データがまだありません。</p>}
        {orders.map((order) => {
          const pay = paymentStatusLabel(order)
          return (
          <article className="glass admin-card" key={order.id}>
            <div className="admin-card-head">
              <div>
                <p className="admin-order-id">{order.id}</p>
                <p className="admin-order-meta">
                  {order.storeName} / {order.lineName}
                </p>
                <p className="admin-order-meta">注文時刻: {formatDateTimeJa(order.createdAt)}</p>
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
            <p className="admin-meta-line">
              <span className={['admin-payment-badge', pay.className].filter(Boolean).join(' ')}>
                {pay.text}
              </span>
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
          )
        })}
      </section>
      ) : null}

      <p className="admin-client-bundle-foot" title="デプロイ後にこのファイル名が変われば新しいフロントが届いています。">
        読み込み中の JS: {frontendBundle}
      </p>
    </main>
  )
}

export default AdminPage
