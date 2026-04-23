import { useMemo, useState } from 'react'

export type MenuItemForPayment = {
  id: string
  name: string
  price: number
  enabled?: boolean
}

type Row = {
  key: string
  menuId: string
  name: string
  price: string
  quantity: string
}

const newRow = (): Row => ({
  key: crypto.randomUUID(),
  menuId: '',
  name: '',
  price: '',
  quantity: '1',
})

const toYen = (value: number) => `¥${value.toLocaleString()}`

type Props = {
  menuItems: MenuItemForPayment[]
}

export default function PaymentLinkGenerator({ menuItems }: Props) {
  const [note, setNote] = useState('')
  const [rows, setRows] = useState<Row[]>(() => [newRow()])
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [generatedOrderId, setGeneratedOrderId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copyDone, setCopyDone] = useState(false)

  const selectableMenu = useMemo(
    () => menuItems.filter((item) => item.enabled !== false),
    [menuItems],
  )

  const total = useMemo(() => {
    return rows.reduce((sum, row) => {
      const p = Number(row.price)
      const q = Number(row.quantity)
      if (!row.name.trim() || Number.isNaN(p) || Number.isNaN(q)) return sum
      return sum + p * q
    }, 0)
  }, [rows])

  const setRow = (key: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  const onMenuSelect = (key: string, menuId: string) => {
    const item = selectableMenu.find((m) => m.id === menuId)
    if (item) {
      setRow(key, {
        menuId,
        name: item.name,
        price: String(item.price),
      })
    } else {
      setRow(key, { menuId: '' })
    }
  }

  const addRow = () => setRows((prev) => [...prev, newRow()])
  const removeRow = (key: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)))
  }

  const buildPayload = () => {
    const items = rows
      .map((row) => ({
        name: row.name.trim(),
        price: Math.round(Number(row.price)),
        quantity: Math.round(Number(row.quantity)),
      }))
      .filter((row) => row.name && row.price > 0 && row.quantity > 0)
    return { items, note: note.trim() || undefined }
  }

  const createLink = async () => {
    setError(null)
    setCopyDone(false)
    setGeneratedUrl('')
    setGeneratedOrderId('')

    const { items, note: noteOpt } = buildPayload()
    if (items.length === 0) {
      setError('商品名・単価・数量を1行以上入力してください。')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, note: noteOpt }),
      })
      const data = (await res.json()) as { url?: string; orderId?: string; error?: unknown }

      if (!res.ok) {
        const msg =
          typeof data.error === 'string'
            ? data.error
            : Array.isArray(data.error)
              ? JSON.stringify(data.error)
              : JSON.stringify(data.error ?? data)
        setError(msg || '決済リンクの生成に失敗しました。')
        return
      }

      if (!data.url || !data.orderId) {
        setError('応答が不正です。')
        return
      }

      setGeneratedUrl(data.url)
      setGeneratedOrderId(data.orderId)
    } catch {
      setError('通信エラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  const copyUrl = async () => {
    if (!generatedUrl) return
    try {
      await navigator.clipboard.writeText(generatedUrl)
      setCopyDone(true)
      setTimeout(() => setCopyDone(false), 2000)
    } catch {
      setError('クリップボードへのコピーに失敗しました。')
    }
  }

  const lineShareHref = generatedUrl
    ? `https://line.me/R/share?text=${encodeURIComponent(`決済ページ\n${generatedUrl}`)}`
    : '#'

  return (
    <section className="glass admin-payment-link">
      <div className="admin-payment-link-head">
        <h2>決済リンク生成</h2>
        <p>Square のオンライン決済ページへのリンクを、注文内容から作成します。</p>
      </div>

      <label className="admin-payment-link-field">
        <span>注文メモ（任意）</span>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="例: ○○キャバクラ 田中さん"
        />
      </label>

      <div className="admin-payment-link-table-wrap">
        <table className="admin-payment-link-table">
          <thead>
            <tr>
              <th>メニュー</th>
              <th>商品名</th>
              <th>単価（円）</th>
              <th>数量</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td>
                  <select
                    className="admin-payment-link-select"
                    value={row.menuId}
                    onChange={(e) => onMenuSelect(row.key, e.target.value)}
                  >
                    <option value="">手入力</option>
                    {selectableMenu.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}（¥{m.price}）
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => setRow(row.key, { name: e.target.value })}
                    placeholder="例: 唐揚げ（5個）"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={row.price}
                    onChange={(e) => setRow(row.key, { price: e.target.value })}
                    placeholder="800"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={row.quantity}
                    onChange={(e) => setRow(row.key, { quantity: e.target.value })}
                    placeholder="1"
                  />
                </td>
                <td>
                  <button type="button" className="admin-payment-link-remove" onClick={() => removeRow(row.key)}>
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" className="admin-payment-link-add" onClick={addRow}>
        ＋ 商品を追加
      </button>

      <p className="admin-payment-link-total">
        合計: <strong>{toYen(total)}</strong>
      </p>

      {error ? <p className="admin-payment-link-error">{error}</p> : null}

      <button type="button" className="btn-gold admin-payment-link-submit" disabled={loading} onClick={createLink}>
        {loading ? '生成中…' : '決済リンクを生成する'}
      </button>

      {generatedUrl ? (
        <div className="admin-payment-link-result">
          <p className="admin-payment-link-result-label">生成されたリンク</p>
          <p className="admin-payment-link-order-id">注文ID: {generatedOrderId}</p>
          <a className="admin-payment-link-url" href={generatedUrl} target="_blank" rel="noreferrer">
            {generatedUrl}
          </a>
          <div className="admin-payment-link-actions">
            <button type="button" onClick={copyUrl}>
              {copyDone ? 'コピー済み' : 'コピー'}
            </button>
            <a href={lineShareHref} target="_blank" rel="noreferrer">
              LINEで送る
            </a>
          </div>
        </div>
      ) : null}
    </section>
  )
}
