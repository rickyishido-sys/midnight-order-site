import { useState } from 'react'

function MenuEditor({ menuItems, onAdd, onUpdate, onDelete, onMove, onClear }) {
  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    category: 'フード',
    imageKey: '',
    requiresReservation: false,
  })

  const addItem = () => {
    const price = Number(form.price)
    if (!form.name.trim() || Number.isNaN(price) || price <= 0) {
      alert('商品名と価格を正しく入力してください。')
      return
    }

    onAdd({
      id: `menu-${Date.now().toString(36)}`,
      name: form.name.trim(),
      price,
      description: form.description.trim(),
      category: form.category || 'フード',
      imageKey: form.imageKey || '',
      enabled: true,
      requiresReservation: form.requiresReservation === true,
    })

    setForm({
      name: '',
      price: '',
      description: '',
      category: 'フード',
      imageKey: '',
      requiresReservation: false,
    })
  }

  return (
    <section className="glass admin-menu">
      <div className="admin-menu-head">
        <h2>日替わりメニュー管理</h2>
        <p>追加・編集・削除・並び替え・日次リセットができます。</p>
        <p className="admin-menu-reservation-hint">
          「予約必要」にチェックした商品は、注文ページと本日のメニューに「要予約」と表示されます（前日16時までの予約が必要な案内）。
        </p>
      </div>

      <div className="admin-menu-add">
        <input
          type="text"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="商品名"
        />
        <input
          type="number"
          value={form.price}
          onChange={(event) => setForm({ ...form, price: event.target.value })}
          placeholder="価格"
        />
        <select
          value={form.category}
          onChange={(event) => setForm({ ...form, category: event.target.value })}
        >
          <option value="フード">フード</option>
          <option value="ドリンク">ドリンク</option>
          <option value="乾き物">乾き物</option>
        </select>
        <input
          type="text"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder="説明（任意）"
        />
        <select
          value={form.imageKey}
          onChange={(event) => setForm({ ...form, imageKey: event.target.value })}
        >
          <option value="">画像なし（デフォルト）</option>
          <option value="karaage">唐揚げ</option>
          <option value="fries">フライドポテト</option>
          <option value="snack">乾き物・おつまみ</option>
          <option value="onigiri">おにぎり</option>
        </select>
        <label className="admin-menu-toggle admin-menu-toggle-reservation">
          <input
            type="checkbox"
            checked={form.requiresReservation}
            onChange={(event) => setForm({ ...form, requiresReservation: event.target.checked })}
          />
          予約必要
        </label>
        <button className="btn-gold" type="button" onClick={addItem}>
          追加
        </button>
      </div>

      <div className="admin-menu-list">
        {menuItems.map((item, index) => (
          <div className="admin-menu-item" key={item.id}>
            <input
              type="text"
              value={item.name}
              onChange={(event) => onUpdate(item.id, 'name', event.target.value)}
            />
            <input
              type="number"
              value={item.price}
              onChange={(event) => onUpdate(item.id, 'price', Number(event.target.value))}
            />
            <select
              value={item.category || 'フード'}
              onChange={(event) => onUpdate(item.id, 'category', event.target.value)}
            >
              <option value="フード">フード</option>
              <option value="ドリンク">ドリンク</option>
              <option value="乾き物">乾き物</option>
            </select>
            <input
              type="text"
              value={item.description || ''}
              onChange={(event) => onUpdate(item.id, 'description', event.target.value)}
              placeholder="説明"
            />
            <select
              value={item.imageKey || ''}
              onChange={(event) => onUpdate(item.id, 'imageKey', event.target.value)}
            >
              <option value="">画像なし（デフォルト）</option>
              <option value="karaage">唐揚げ</option>
              <option value="fries">フライドポテト</option>
              <option value="snack">乾き物・おつまみ</option>
              <option value="onigiri">おにぎり</option>
            </select>
            <label className="admin-menu-toggle admin-menu-toggle-reservation">
              <input
                type="checkbox"
                checked={item.requiresReservation === true}
                onChange={(event) => onUpdate(item.id, 'requiresReservation', event.target.checked)}
              />
              予約必要
            </label>
            <label className="admin-menu-toggle">
              <input
                type="checkbox"
                checked={item.enabled !== false}
                onChange={(event) => onUpdate(item.id, 'enabled', event.target.checked)}
              />
              公開
            </label>
            <div className="admin-menu-actions">
              <button type="button" disabled={index === 0} onClick={() => onMove(item.id, -1)}>
                ↑
              </button>
              <button
                type="button"
                disabled={index === menuItems.length - 1}
                onClick={() => onMove(item.id, 1)}
              >
                ↓
              </button>
              <button type="button" onClick={() => onDelete(item.id)}>
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-menu-reset">
        <button type="button" onClick={onClear}>
          全削除 / 日付リセット
        </button>
      </div>
    </section>
  )
}

export default MenuEditor
