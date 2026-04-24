import type { VercelResponse } from '@vercel/node'

/** KV 等の可変データを返す API 用 — エッジ・ブラウザに長期キャッシュさせない */
export const applyNoStoreJson = (res: VercelResponse) => {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate')
  res.setHeader('CDN-Cache-Control', 'no-store')
}
