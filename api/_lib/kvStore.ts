export const ORDERS_KV_KEY = 'ohaco_orders'
export const CASHBACK_HISTORY_KV_KEY = 'ohaco_cashback_history'
export const MENU_KV_KEY = 'ohaco_menu_catalog'

const hasKvConfig = () =>
  Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
const hasRedisUrl = () => Boolean(process.env.REDIS_URL)

type RedisLikeClient = {
  connect: () => Promise<void>
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string) => Promise<unknown>
}

let redisClient: RedisLikeClient | null = null
let redisClassPromise: Promise<new (url: string, options: Record<string, unknown>) => RedisLikeClient> | null = null
let vercelKvClientPromise: Promise<{ get: (key: string) => Promise<unknown>; set: (key: string, value: unknown) => Promise<unknown> }> | null = null

const getRedisClass = async () => {
  if (!redisClassPromise) {
    redisClassPromise = import('ioredis').then((mod) => (mod.default ?? mod) as new (url: string, options: Record<string, unknown>) => RedisLikeClient)
  }
  return redisClassPromise
}

const getRedisClient = async () => {
  if (!hasRedisUrl()) throw new Error('REDIS_URL is not set')
  if (!redisClient) {
    const Redis = await getRedisClass()
    redisClient = new Redis(process.env.REDIS_URL!, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    })
    await redisClient.connect()
  }
  return redisClient
}

const getVercelKvClient = async () => {
  if (!hasKvConfig()) throw new Error('KV_REST_API_URL and KV_REST_API_TOKEN are not set')
  if (!vercelKvClientPromise) {
    vercelKvClientPromise = import('@vercel/kv').then((mod) => mod.kv)
  }
  return vercelKvClientPromise
}

const ensureKvConfig = () => {
  if (!hasKvConfig() && !hasRedisUrl()) {
    throw new Error(
      'Storage is not configured. Set KV_REST_API_URL+KV_REST_API_TOKEN or REDIS_URL.',
    )
  }
}

const getArray = async (key: string) => {
  ensureKvConfig()
  if (hasKvConfig()) {
    const kv = await getVercelKvClient()
    const data = await kv.get(key)
    return Array.isArray(data) ? data : []
  }
  const client = await getRedisClient()
  const raw = await client.get(key)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const setArray = async (key: string, value: unknown[]) => {
  ensureKvConfig()
  if (hasKvConfig()) {
    const kv = await getVercelKvClient()
    await kv.set(key, value)
    return
  }
  const client = await getRedisClient()
  await client.set(key, JSON.stringify(value))
}

export const readOrdersFromKv = async () => {
  return getArray(ORDERS_KV_KEY)
}

export const writeOrdersToKv = async (orders: unknown[]) => {
  await setArray(ORDERS_KV_KEY, orders)
}

export const upsertOrderInKv = async (order: Record<string, unknown>) => {
  const orders = await readOrdersFromKv()
  const id = String(order.id || '')
  if (!id) throw new Error('order.id is required')
  const index = orders.findIndex((item) => String((item as { id?: string }).id || '') === id)
  if (index >= 0) {
    orders[index] = { ...orders[index], ...order }
  } else {
    orders.unshift(order)
  }
  await writeOrdersToKv(orders)
  return orders
}

export const patchOrderInKv = async (id: string, patch: Record<string, unknown>) => {
  const orders = await readOrdersFromKv()
  const index = orders.findIndex((item) => String((item as { id?: string }).id || '') === id)
  if (index < 0) return null
  const next = {
    ...orders[index],
    ...patch,
  }
  orders[index] = next
  await writeOrdersToKv(orders)
  return next
}

export const readCashbackHistoryFromKv = async () => {
  return getArray(CASHBACK_HISTORY_KV_KEY)
}

export const writeCashbackHistoryToKv = async (history: unknown[]) => {
  await setArray(CASHBACK_HISTORY_KV_KEY, history)
}

/** KV に一度も書いていないときは null。空配列は「メニュー全削除」として有効。 */
export const readMenuFromKv = async (): Promise<unknown[] | null> => {
  ensureKvConfig()
  if (hasKvConfig()) {
    const kv = await getVercelKvClient()
    const data = await kv.get(MENU_KV_KEY)
    if (data === null || data === undefined) return null
    return Array.isArray(data) ? data : null
  }
  const client = await getRedisClient()
  const raw = await client.get(MENU_KV_KEY)
  if (raw === null || raw === undefined) return null
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export const writeMenuToKv = async (items: unknown[]) => {
  await setArray(MENU_KV_KEY, items)
}

export const upsertCashbackEntryInKv = async (entry: Record<string, unknown>) => {
  const history = await readCashbackHistoryFromKv()
  const id = String(entry.id || '')
  if (!id) throw new Error('entry.id is required')
  const index = history.findIndex((item) => String((item as { id?: string }).id || '') === id)
  if (index >= 0) {
    history[index] = { ...history[index], ...entry }
  } else {
    history.unshift(entry)
  }
  await writeCashbackHistoryToKv(history)
  return history
}
