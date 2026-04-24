import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyNoStoreJson } from './_lib/cacheHeaders.js'
import {
  readCashbackHistoryFromKv,
  upsertCashbackEntryInKv,
  writeCashbackHistoryToKv,
} from './_lib/kvStore.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyNoStoreJson(res)
  try {
    if (req.method === 'GET') {
      const history = await readCashbackHistoryFromKv()
      return res.status(200).json({ history })
    }

    if (req.method === 'POST') {
      const { entry } = req.body || {}
      if (!entry || !entry.id) {
        return res.status(400).json({ error: 'entry.id is required' })
      }
      const history = await upsertCashbackEntryInKv(entry)
      return res.status(200).json({ ok: true, history })
    }

    if (req.method === 'PUT') {
      const { history } = req.body || {}
      if (!Array.isArray(history)) {
        return res.status(400).json({ error: 'history array is required' })
      }
      await writeCashbackHistoryToKv(history)
      return res.status(200).json({ ok: true, history })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to handle cashback history',
      details: error instanceof Error ? error.message : 'unknown error',
    })
  }
}
