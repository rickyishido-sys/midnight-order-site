import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyNoStoreJson } from './_lib/cacheHeaders.js'
import { readStoreStatusFromKv, writeStoreStatusToKv } from './_lib/kvStore.js'

const DEFAULT_STATUS = { isClosed: false }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyNoStoreJson(res)
  try {
    if (req.method === 'GET') {
      const status = (await readStoreStatusFromKv()) || DEFAULT_STATUS
      return res.status(200).json(status)
    }

    if (req.method === 'PUT') {
      const isClosed = Boolean(req.body?.isClosed)
      const status = { isClosed }
      await writeStoreStatusToKv(status)
      return res.status(200).json(status)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to handle store status',
      details: error instanceof Error ? error.message : 'unknown error',
    })
  }
}
