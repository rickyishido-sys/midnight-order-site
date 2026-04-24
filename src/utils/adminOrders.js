export const ORDERS_KEY = 'midnight-delivery-orders'

export const loadOrders = () => {
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const saveOrders = (orders) => {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
}

const noStoreFetch = (input, init = {}) =>
  fetch(input, { ...init, cache: 'no-store' })

export const fetchOrdersFromServer = async () => {
  const response = await noStoreFetch('/api/orders')
  if (!response.ok) throw new Error('Failed to fetch orders from server')
  const data = await response.json()
  const orders = Array.isArray(data.orders) ? data.orders : []
  saveOrders(orders)
  return orders
}

export const syncOrdersToServer = async (orders) => {
  const response = await noStoreFetch('/api/orders', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orders }),
  })
  if (!response.ok) throw new Error('Failed to sync orders to server')
}

export const upsertOrderToServer = async (order) => {
  const response = await noStoreFetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order }),
  })
  if (!response.ok) throw new Error('Failed to upsert order on server')
}

export const patchOrderToServer = async (id, patch) => {
  const response = await noStoreFetch('/api/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, patch }),
  })
  if (!response.ok) throw new Error('Failed to patch order on server')
}

export const upsertOrder = (order) => {
  const orders = loadOrders()
  const index = orders.findIndex((item) => item.id === order.id)
  if (index >= 0) {
    orders[index] = order
  } else {
    orders.unshift(order)
  }
  saveOrders(orders)
  noStoreFetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order }),
  }).catch(() => {})
}
