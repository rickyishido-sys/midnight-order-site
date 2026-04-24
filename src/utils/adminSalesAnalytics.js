const TOKYO = 'Asia/Tokyo'

/** 東京日付の YYYY-MM（売上計上月のキー） */
export function toMonthKeyFromIso(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const s = d.toLocaleString('sv-SE', { timeZone: TOKYO })
  return s.slice(0, 7)
}

/** 東京の「今月」YYYY-MM と直近 n ヶ月のキー一覧（新しい順） */
export function listRecentMonthKeys(count = 12) {
  const nowTokyo = new Date().toLocaleString('sv-SE', { timeZone: TOKYO })
  const [y0, m0] = nowTokyo.slice(0, 10).split('-').map(Number)
  const keys = []
  let y = y0
  let m = m0
  for (let i = 0; i < count; i += 1) {
    keys.push(`${y}-${String(m).padStart(2, '0')}`)
    m -= 1
    if (m < 1) {
      m = 12
      y -= 1
    }
  }
  return keys
}

export function formatMonthLabelJa(monthKey) {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return monthKey
  const [y, mo] = monthKey.split('-')
  return `${Number(y)}年${Number(mo)}月`
}

/** 東京日付の YYYY-MM-DD */
export function toDayKeyFromIso(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('sv-SE', { timeZone: TOKYO }).slice(0, 10)
}

export function formatDayLabelJa(dayKey) {
  if (!dayKey || !/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return dayKey
  const dt = new Date(`${dayKey}T12:00:00+09:00`)
  if (Number.isNaN(dt.getTime())) return dayKey
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: TOKYO,
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(dt)
}

/** 対象月の全日付キー（1日〜月末） */
export function listDayKeysInMonth(monthKey) {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return []
  const [y, mo] = monthKey.split('-').map(Number)
  const lastDay = new Date(y, mo, 0).getDate()
  const keys = []
  for (let d = 1; d <= lastDay; d += 1) {
    keys.push(`${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  return keys
}

/**
 * 配達完了済み注文リストを、計上日（deliveredAt なければ createdAt）の東京暦で日別に集計。
 * 対象月のカレンダー上の全日を行として返し、注文がない日は 0 件・¥0。
 */
export function aggregateDailySalesForMonth(orderList, monthKey) {
  const dayKeys = listDayKeysInMonth(monthKey)
  const map = new Map()
  for (const o of orderList) {
    const iso = o.deliveredAt || o.createdAt
    const day = toDayKeyFromIso(iso)
    if (!day || day.slice(0, 7) !== monthKey) continue
    const cur = map.get(day) || { day, count: 0, revenue: 0 }
    cur.count += 1
    cur.revenue += Number(o.total || 0)
    map.set(day, cur)
  }
  return dayKeys.map((day) => map.get(day) || { day, count: 0, revenue: 0 })
}

/** 配達完了かつ計上月が一致する注文（deliveredAt 優先、無ければ createdAt） */
export function filterDeliveredRevenueInMonth(orders, monthKey) {
  return orders.filter((o) => {
    if (o.deliveryStatus !== 'delivered') return false
    const ts = o.deliveredAt || o.createdAt
    return toMonthKeyFromIso(ts) === monthKey
  })
}

export function sumOrderTotals(orderList) {
  return orderList.reduce((sum, o) => sum + Number(o.total || 0), 0)
}

/** 商品名ごとの数量・売上（行小計は price * quantity） */
export function aggregateProductSales(orderList) {
  const map = new Map()
  for (const o of orderList) {
    const items = Array.isArray(o.items) ? o.items : []
    for (const it of items) {
      const name = String(it.name || '（名称不明）')
      const qty = Number(it.quantity || 0)
      const price = Number(it.price || 0)
      const line = price * qty
      const cur = map.get(name) || { name, quantity: 0, revenue: 0 }
      cur.quantity += qty
      cur.revenue += line
      map.set(name, cur)
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue)
}

/** 受注時刻（東京）の時間帯 0–23 ごとの件数・売上 */
export function aggregateHourlyByOrderTime(orderList) {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0,
    revenue: 0,
  }))
  for (const o of orderList) {
    const created = o.createdAt
    if (!created) continue
    const d = new Date(created)
    if (Number.isNaN(d.getTime())) continue
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: TOKYO,
      hour: 'numeric',
      hourCycle: 'h23',
    }).formatToParts(d)
    const hv = parts.find((p) => p.type === 'hour')?.value
    const h = hv !== undefined ? parseInt(hv, 10) : -1
    if (h < 0 || h > 23) continue
    buckets[h].count += 1
    buckets[h].revenue += Number(o.total || 0)
  }
  return buckets
}
