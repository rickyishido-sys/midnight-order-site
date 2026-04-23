import { useEffect, useMemo, useState } from 'react'
import { fetchOrdersFromServer, loadOrders } from '../utils/adminOrders'
import {
  fetchCashbackHistoryFromServer,
  loadCashbackHistory,
  saveCashbackHistory,
} from '../utils/cashbackStore'

const MIN_WITHDRAWAL = 1000

const mockHistory = [
  {
    id: 'order_001',
    date: '2025-04-20',
    items: ['唐揚げ×2', 'フライドポテト×1'],
    total: 2200,
    cashback: 220,
  },
  {
    id: 'order_002',
    date: '2025-04-22',
    items: ['おにぎり×3', 'スナック×1'],
    total: 1500,
    cashback: 150,
  },
]

const buildMergedHistory = (storedHistory, orderSource) => {
  const base = storedHistory.length > 0 ? storedHistory : mockHistory
  const entries = Array.isArray(base) ? [...base] : []

  const orderBased = orderSource
    .filter((order) => order.paymentStatus === 'paid' && Number(order.cashbackAmount || 0) > 0)
    .map((order) => ({
      id: order.id,
      date: String(order.createdAt || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
      items: (order.items || []).map((item) => `${item.name}×${item.quantity}`),
      total: Number(order.total || 0),
      cashback: Number(order.cashbackAmount || 0),
    }))

  for (const entry of orderBased) {
    if (!entries.some((item) => item.id === entry.id)) {
      entries.unshift(entry)
    }
  }

  saveCashbackHistory(entries)
  return entries
}

const toYen = (value) => `¥ ${Number(value || 0).toLocaleString()}`

function CashbackPage() {
  const [history, setHistory] = useState(() => buildMergedHistory(loadCashbackHistory(), loadOrders()))
  const [method, setMethod] = useState('paypay')

  useEffect(() => {
    const syncFromServer = async () => {
      try {
        const [serverHistory, serverOrders] = await Promise.all([
          fetchCashbackHistoryFromServer(),
          fetchOrdersFromServer(),
        ])
        const merged = buildMergedHistory(serverHistory, serverOrders)
        setHistory(merged)
      } catch {
        // offline fallback keeps local data
      }
    }
    syncFromServer()
  }, [])

  const balance = useMemo(
    () => history.reduce((sum, item) => sum + Number(item.cashback || 0), 0),
    [history],
  )
  const canClaim = balance >= MIN_WITHDRAWAL

  const submitClaim = () => {
    if (!canClaim) return
    const methodLabel =
      method === 'paypay' ? 'PayPay' : method === 'bank' ? '銀行振込' : '次回割引'
    window.alert(`${methodLabel}で申請を受け付けました。`)
  }

  return (
    <main className="cashback-page">
      <header className="cashback-header">
        <a className="cashback-back" href="/menu">
          ← 戻る
        </a>
        <h1>キャッシュバック確認</h1>
      </header>

      <section className="glass cashback-balance">
        <p>現在の残高</p>
        <strong>{toYen(balance)}</strong>
      </section>

      <section className="glass cashback-claim">
        <h2>受け取り申請</h2>
        <p className="cashback-claim-note">
          {canClaim ? `¥${MIN_WITHDRAWAL.toLocaleString()} 以上で申請できます。` : `申請にはあと ${toYen(MIN_WITHDRAWAL - balance)} 必要です。`}
        </p>
        <label>
          受け取り方法
          <select value={method} onChange={(event) => setMethod(event.target.value)}>
            <option value="paypay">PayPay</option>
            <option value="bank">銀行振込</option>
            <option value="next_discount">次回割引</option>
          </select>
        </label>
        <button type="button" className="btn-primary cashback-submit" disabled={!canClaim} onClick={submitClaim}>
          申請する
        </button>
      </section>

      <section className="glass cashback-history">
        <h2>注文・獲得履歴</h2>
        {history.length === 0 ? (
          <p className="cashback-empty">履歴はまだありません。</p>
        ) : (
          <ul>
            {history.map((entry) => (
              <li key={entry.id}>
                <div className="cashback-history-head">
                  <p>{entry.date}</p>
                  <strong>+ {toYen(entry.cashback)}</strong>
                </div>
                <p className="cashback-history-items">{entry.items.join(' / ')}</p>
                <p className="cashback-history-total">注文金額: {toYen(entry.total)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default CashbackPage
