export const CASHBACK_HISTORY_KEY = 'ohaco_cashback_history'

export const loadCashbackHistory = () => {
  try {
    const raw = localStorage.getItem(CASHBACK_HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const saveCashbackHistory = (history) => {
  localStorage.setItem(CASHBACK_HISTORY_KEY, JSON.stringify(history))
}

export const fetchCashbackHistoryFromServer = async () => {
  const response = await fetch('/api/cashback-history')
  if (!response.ok) throw new Error('Failed to fetch cashback history from server')
  const data = await response.json()
  const history = Array.isArray(data.history) ? data.history : []
  saveCashbackHistory(history)
  return history
}

export const upsertCashbackEntryToServer = async (entry) => {
  const response = await fetch('/api/cashback-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entry }),
  })
  if (!response.ok) throw new Error('Failed to upsert cashback entry')
}
