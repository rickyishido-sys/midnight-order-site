const noStoreFetch = (input, init = {}) => fetch(input, { ...init, cache: 'no-store' })

export const fetchStoreStatusFromServer = async () => {
  const response = await noStoreFetch('/api/store-status')
  if (!response.ok) throw new Error('Failed to fetch store status')
  const data = await response.json()
  return { isClosed: Boolean(data?.isClosed) }
}

export const updateStoreStatusToServer = async (isClosed) => {
  const response = await noStoreFetch('/api/store-status', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isClosed: Boolean(isClosed) }),
  })
  if (!response.ok) throw new Error('Failed to update store status')
  const data = await response.json()
  return { isClosed: Boolean(data?.isClosed) }
}
