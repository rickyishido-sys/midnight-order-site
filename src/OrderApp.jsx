import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header'
import InputSection from './components/InputSection'
import MenuList from './components/MenuList'
import CartSummary from './components/CartSummary'
import OrderButton from './components/OrderButton'
import { initLineClient, openStoreLine } from './utils/lineClient'
import {
  fetchOrdersFromServer,
  loadOrders,
  patchOrderToServer,
  saveOrders,
  upsertOrderToServer,
} from './utils/adminOrders'
import { fetchMenuFromServer, loadMenuItems } from './utils/menuStore'
import { createSquarePaymentLink } from './utils/squareCheckout'
import { fetchStoreStatusFromServer } from './utils/storeStatus'

const MINIMUM_ORDER = 3000
const CUSTOMER_BACK = 300
const DELIVERY_FEE = 1000
const STORAGE_KEY = 'midnight-delivery-order'
const LAST_ORDER_KEY = 'midnight-delivery-last-order'
const ALLOWED_WARDS = ['横浜市中区', '横浜市南区', '横浜市西区']
const PAYMENT_METHODS = {
  cash: '現地払い',
  square: 'オンライン決済（クレカ / PayPay / 交通系 など）',
}
const CASHBACK_METHODS = {
  next_discount: '次回値引き',
  paypay: 'PayPay送金',
  bank: '銀行振込',
}

const initialState = {
  storeName: '',
  lineName: '',
  zipCode: '',
  address: '',
  reservationDate: '',
  reservationTime: '',
  note: '',
  paymentMethod: 'cash',
  cashbackMethod: 'next_discount',
  cashbackPaypayId: '',
  cashbackBankInfo: '',
  quantities: {},
}

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw)
    return {
      storeName: parsed.storeName ?? '',
      lineName: parsed.lineName ?? '',
      zipCode: parsed.zipCode ?? '',
      address: parsed.address ?? '',
      reservationDate: parsed.reservationDate ?? '',
      reservationTime: parsed.reservationTime ?? '',
      note: parsed.note ?? '',
      paymentMethod: parsed.paymentMethod ?? 'cash',
      cashbackMethod: parsed.cashbackMethod ?? 'next_discount',
      cashbackPaypayId: parsed.cashbackPaypayId ?? '',
      cashbackBankInfo: parsed.cashbackBankInfo ?? '',
      quantities: parsed.quantities ?? {},
    }
  } catch {
    return initialState
  }
}

const isAllowedArea = (address = '') =>
  ALLOWED_WARDS.some((ward) => address.includes(ward))

const createOrderId = () => `OD-${Date.now().toString(36).toUpperCase()}`
const CASHBACK_HISTORY_KEY = 'ohaco_cashback_history'

const appendCashbackHistoryFromOrder = (order) => {
  if (!order || !order.id || Number(order.cashbackAmount || 0) <= 0) return
  try {
    const raw = localStorage.getItem(CASHBACK_HISTORY_KEY)
    const current = raw ? JSON.parse(raw) : []
    const history = Array.isArray(current) ? current : []
    if (history.some((entry) => entry.id === order.id)) return
    history.unshift({
      id: order.id,
      date: new Date().toISOString().slice(0, 10),
      items: (order.items || []).map((item) => `${item.name}×${item.quantity}`),
      total: Number(order.total || 0),
      cashback: Number(order.cashbackAmount || 0),
    })
    localStorage.setItem(CASHBACK_HISTORY_KEY, JSON.stringify(history))
  } catch {
    // noop
  }
}

function OrderApp() {
  const [form, setForm] = useState(loadFromStorage)
  const [error, setError] = useState('')
  const [lineStatus, setLineStatus] = useState('')
  const [zipLoading, setZipLoading] = useState(false)
  const [zipError, setZipError] = useState('')
  const [menuCatalog, setMenuCatalog] = useState(loadMenuItems)
  const [completedOrder, setCompletedOrder] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [storeClosed, setStoreClosed] = useState(false)
  const [hasLastOrder, setHasLastOrder] = useState(() =>
    Boolean(localStorage.getItem(LAST_ORDER_KEY)),
  )

  useEffect(() => {
    const syncReturnedSquarePayment = async () => {
      const params = new URLSearchParams(window.location.search)
      if (params.get('payment') !== 'success') return

      const localOrderId = params.get('orderId')
      if (!localOrderId) return

      let orders = loadOrders()
      try {
        orders = await fetchOrdersFromServer()
      } catch {
        // fallback local only
      }
      const target = orders.find((order) => order.id === localOrderId)
      if (!target || target.paymentMethod !== 'square' || !target.squareOrderId) return
      if (target.paymentStatus === 'paid') return

      try {
        const response = await fetch(
          `/api/get-square-order-status?squareOrderId=${encodeURIComponent(target.squareOrderId)}`,
          { cache: 'no-store' },
        )
        if (!response.ok) return
        const data = await response.json()
        if (!data.paid) return

        const paidOrder = {
          ...target,
          paymentStatus: 'paid',
          paymentPaidAt: new Date().toISOString(),
        }
        upsertOrder(paidOrder)
        patchOrderToServer(localOrderId, {
          paymentStatus: 'paid',
          paymentPaidAt: paidOrder.paymentPaidAt,
        }).catch(() => {})
        appendCashbackHistoryFromOrder(paidOrder)
      } catch {
        // noop
      } finally {
        const cleanUrl = `${window.location.pathname}${window.location.hash || ''}`
        window.history.replaceState({}, '', cleanUrl)
      }
    }

    syncReturnedSquarePayment()
  }, [])

  useEffect(() => {
    fetchMenuFromServer()
      .then(setMenuCatalog)
      .catch(() => {})
    fetchStoreStatusFromServer()
      .then((status) => setStoreClosed(status.isClosed))
      .catch(() => {})
  }, [])

  const activeMenuItems = useMemo(
    () => menuCatalog.filter((item) => item.enabled !== false),
    [menuCatalog],
  )

  useEffect(() => {
    const setupLiff = async () => {
      try {
        await initLineClient()
      } catch {
        setLineStatus('LINE連携の初期化に失敗しました。通常ブラウザ送信でご利用ください。')
      }
    }
    setupLiff()
  }, [])

  const cartItems = useMemo(
    () =>
      activeMenuItems
        .map((item) => ({
          ...item,
          quantity: form.quantities[item.id] ?? 0,
        }))
        .filter((item) => item.quantity > 0),
    [form.quantities, activeMenuItems],
  )

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  )

  const total = subtotal + DELIVERY_FEE
  const shortage = Math.max(0, MINIMUM_ORDER - subtotal)
  const canOrder = !storeClosed && subtotal >= MINIMUM_ORDER && cartItems.length > 0

  const persist = (nextForm) => {
    setForm(nextForm)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextForm))
  }

  const updateField = (key, value) => {
    persist({ ...form, [key]: value })
  }

  const updateQuantity = (id, delta) => {
    const current = form.quantities[id] ?? 0
    const nextQty = Math.max(0, current + delta)
    const nextQuantities = { ...form.quantities, [id]: nextQty }
    if (nextQty === 0) delete nextQuantities[id]
    persist({ ...form, quantities: nextQuantities })
  }

  const saveOrderLocal = (order) => {
    const orders = loadOrders()
    const index = orders.findIndex((item) => item.id === order.id)
    if (index >= 0) {
      orders[index] = order
    } else {
      orders.unshift(order)
    }
    saveOrders(orders)
  }

  const lookupZipCode = async () => {
    const cleanZip = form.zipCode.replace(/[^0-9]/g, '')
    if (cleanZip.length !== 7) {
      setZipError('郵便番号は7桁で入力してください。')
      return
    }

    setZipError('')
    setZipLoading(true)
    try {
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanZip}`)
      const data = await response.json()
      if (!data.results || !data.results[0]) {
        setZipError('住所が見つかりませんでした。')
        return
      }
      const hit = data.results[0]
      const nextAddress = `${hit.address1}${hit.address2}${hit.address3}`
      if (!isAllowedArea(nextAddress)) {
        setZipError('配達対象は横浜市中区・南区・西区のみです。')
        return
      }
      persist({
        ...form,
        zipCode: cleanZip,
        address: nextAddress,
      })
    } catch {
      setZipError('住所検索に失敗しました。時間をおいてお試しください。')
    } finally {
      setZipLoading(false)
    }
  }

  const restoreLastOrder = () => {
    const raw = localStorage.getItem(LAST_ORDER_KEY)
    if (!raw) {
      setHasLastOrder(false)
      return
    }
    try {
      const parsed = JSON.parse(raw)
      const next = {
        storeName: parsed.storeName ?? '',
        lineName: parsed.lineName ?? '',
        zipCode: parsed.zipCode ?? '',
        address: parsed.address ?? '',
        reservationDate: parsed.reservationDate ?? '',
        reservationTime: parsed.reservationTime ?? '',
        note: parsed.note ?? '',
      paymentMethod: parsed.paymentMethod ?? 'cash',
      cashbackMethod: parsed.cashbackMethod ?? 'next_discount',
      cashbackPaypayId: parsed.cashbackPaypayId ?? '',
      cashbackBankInfo: parsed.cashbackBankInfo ?? '',
        quantities: parsed.quantities ?? {},
      }
      persist(next)
    } catch {
      setHasLastOrder(false)
    }
  }

  const handleOrder = async () => {
    if (submitting) return
    if (storeClosed) {
      setError('本日は定休日です。')
      return
    }
    if (subtotal < MINIMUM_ORDER) {
      setError(`最低注文金額まであと¥${shortage.toLocaleString()}必要です。`)
      return
    }

    if (cartItems.length === 0) {
      setError('商品を1つ以上選択してください。')
      return
    }

    if (!isAllowedArea(form.address)) {
      setError('配達対象は横浜市中区・南区・西区のみです。住所をご確認ください。')
      return
    }

    if (form.cashbackMethod === 'paypay' && !form.cashbackPaypayId.trim()) {
      setError('PayPay送金を選択した場合は、PayPay ID/電話番号を入力してください。')
      return
    }

    if (form.cashbackMethod === 'bank' && !form.cashbackBankInfo.trim()) {
      setError('銀行振込を選択した場合は、振込先情報を入力してください。')
      return
    }

    const hasReservationItems = cartItems.some(
      (item) => item.requiresReservation === true && item.quantity > 0,
    )
    if (hasReservationItems && (!form.reservationDate || !form.reservationTime)) {
      setError('要予約商品を含むため、配達希望日と希望時間を入力してください。')
      return
    }

    setError('')
    setSubmitting(true)
    const orderRecord = {
      id: createOrderId(),
      createdAt: new Date().toISOString(),
      storeName: form.storeName || '未入力',
      lineName: form.lineName || '未入力',
      zipCode: form.zipCode || '',
      address: form.address || '',
      reservationDate: form.reservationDate || '',
      reservationTime: form.reservationTime || '',
      note: form.note || '',
      items: cartItems,
      subtotal,
      deliveryFee: DELIVERY_FEE,
      total,
      minimumOrder: MINIMUM_ORDER,
      deliveryStatus: 'ordered',
      cashbackStatus: 'pending',
      cashbackAmount: CUSTOMER_BACK,
      cashbackMethod: form.cashbackMethod,
      cashbackReceiver:
        form.cashbackMethod === 'paypay'
          ? form.cashbackPaypayId
          : form.cashbackMethod === 'bank'
            ? form.cashbackBankInfo
            : '',
      paymentMethod: form.paymentMethod,
      paymentStatus: form.paymentMethod === 'square' ? 'pending' : 'not_required',
      deliveredAt: null,
      cashbackPaidAt: null,
    }
    saveOrderLocal(orderRecord)
    try {
      await upsertOrderToServer(orderRecord)
    } catch {
      setError('注文の保存に失敗しました。通信環境を確認して再度お試しください。')
      setSubmitting(false)
      return
    }
    localStorage.setItem(
      LAST_ORDER_KEY,
      JSON.stringify({
        ...form,
        quantities: form.quantities,
      }),
    )
    setHasLastOrder(true)

    if (form.paymentMethod === 'square') {
      try {
        const square = await createSquarePaymentLink({
          orderId: orderRecord.id,
          total,
          note: form.note,
        })
        const enrichedOrder = {
          ...orderRecord,
          squarePaymentLinkId: square.paymentLinkId || '',
          squareOrderId: square.squareOrderId || '',
        }
        saveOrderLocal(enrichedOrder)
        upsertOrderToServer(enrichedOrder).catch(() => {})
        setCompletedOrder({
          ...enrichedOrder,
          paymentLabel: PAYMENT_METHODS[form.paymentMethod],
          cashbackLabel: CASHBACK_METHODS[form.cashbackMethod],
        })
        window.location.href = square.url
      } catch {
        setError('Square決済リンクの作成に失敗しました。管理者に連絡してください。')
        setSubmitting(false)
      }
      return
    }

    setCompletedOrder({
      ...orderRecord,
      paymentLabel: PAYMENT_METHODS[form.paymentMethod],
      cashbackLabel: CASHBACK_METHODS[form.cashbackMethod],
    })
    setSubmitting(false)
  }

  if (completedOrder) {
    return (
      <main className="page">
        <section className="summary glass-gold" style={{ marginTop: '24px' }}>
          <div className="section-head">
            <p className="section-eyebrow">ORDER COMPLETED</p>
            <p className="section-title">ご注文ありがとうございました</p>
          </div>
          <p className="empty">注文を受け付けました。お届けまでしばらくお待ちください。</p>
          <div className="summary-row">
            <span>注文番号</span>
            <span>{completedOrder.id}</span>
          </div>
          <div className="summary-row">
            <span>合計金額</span>
            <span>¥{Number(completedOrder.total || 0).toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>キャッシュバック額</span>
            <span>¥{Number(completedOrder.cashbackAmount || 0).toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>キャッシュバック方法</span>
            <span>{completedOrder.cashbackLabel}</span>
          </div>
          {completedOrder.reservationDate ? (
            <div className="summary-row">
              <span>希望お届け日時（要予約）</span>
              <span>
                {completedOrder.reservationDate}
                {completedOrder.reservationTime ? ` ${completedOrder.reservationTime}` : ''}
              </span>
            </div>
          ) : null}
          <div className="summary-row">
            <span>決済方法</span>
            <span>{completedOrder.paymentLabel}</span>
          </div>
          <button className="order-button btn-gold" type="button" onClick={openStoreLine}>
            OHACOのLINEに戻る
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="page">
      <div className="order-top-links">
        <a className="back-to-lp" href="/">
          サービス紹介へ戻る
        </a>
        <a className="back-to-lp" href="/menu">
          本日のメニューを見る
        </a>
      </div>
      <Header />
      {storeClosed ? <p className="store-closed-banner">本日は定休日です。</p> : null}
      <InputSection
        storeName={form.storeName}
        lineName={form.lineName}
        zipCode={form.zipCode}
        address={form.address}
        reservationDate={form.reservationDate}
        reservationTime={form.reservationTime}
        hasReservationItems={cartItems.some((item) => item.requiresReservation === true && item.quantity > 0)}
        note={form.note}
        paymentMethod={form.paymentMethod}
        cashbackMethod={form.cashbackMethod}
        cashbackPaypayId={form.cashbackPaypayId}
        cashbackBankInfo={form.cashbackBankInfo}
        onChangeField={updateField}
        onLookupZip={lookupZipCode}
        zipLoading={zipLoading}
        zipError={zipError}
        hasLastOrder={hasLastOrder}
        onRestoreLastOrder={restoreLastOrder}
      />
      <MenuList items={activeMenuItems} quantities={form.quantities} onAdjust={updateQuantity} />
      <CartSummary
        cartItems={cartItems}
        subtotal={subtotal}
        deliveryFee={DELIVERY_FEE}
        total={total}
        minimumOrder={MINIMUM_ORDER}
        customerBack={CUSTOMER_BACK}
        error={(storeClosed ? '本日は定休日です。' : error) || lineStatus}
      />
      <OrderButton
        canOrder={canOrder}
        subtotal={subtotal}
        total={total}
        minimumOrder={MINIMUM_ORDER}
        onOrder={handleOrder}
        submitting={submitting}
        storeClosed={storeClosed}
      />
    </main>
  )
}

export default OrderApp
