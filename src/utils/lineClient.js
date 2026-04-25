import liff from '@line/liff'

const LIFF_ID = import.meta.env.VITE_LIFF_ID
let initialized = false

const openOrRedirect = (url) => {
  const popup = window.open(url, '_blank', 'noopener,noreferrer')
  if (popup) return
  // iOS Safari blocks async popup opens; redirect in same tab as fallback.
  window.location.href = url
}

export const initLineClient = async () => {
  if (!LIFF_ID || initialized) return
  await liff.init({ liffId: LIFF_ID })
  initialized = true
}

export const sendOrderToLine = async (message) => {
  const encodedUrl = `https://line.me/R/msg/text/?${encodeURIComponent(message)}`

  if (!LIFF_ID) {
    openOrRedirect(encodedUrl)
    return
  }

  try {
    await initLineClient()
    if (liff.isInClient()) {
      await liff.sendMessages([{ type: 'text', text: message }])
      return
    }
  } catch {
    // Fall back to LINE URL share if LIFF fails.
  }

  openOrRedirect(encodedUrl)
}
