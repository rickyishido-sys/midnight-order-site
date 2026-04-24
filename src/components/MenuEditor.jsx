import { useState } from 'react'
import { DISPLAY_SECTION_OPTIONS } from '../utils/menuDisplaySections'
import { MENU_IMAGE_OPTIONS } from '../utils/menuImageKeys'

function MenuEditor({ menuItems, onAdd, onUpdate, onDelete, onMove, onClear }) {
  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    displaySection: 'カリッと',
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
      category: 'フード',
      displaySection: form.displaySection,
      imageKey: form.imageKey || '',
      enabled: true,
      requiresReservation: form.requiresReservation === true,
    })

    setForm({
      name: '',
      price: '',
      description: '',
      displaySection: 'カリッと',
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
          「表示セクション」は注文ページ・本日のメニューで見出しごとに並びます（カリッと／さっぱりと／〆に／ひと皿で／盛り合わせ）。
        </p>
        <p className="admin-menu-reservation-hint">
          「予約必要」にチェックした商品は、注文ページと本日のメニューに「要予約」と表示されます（前日16時までの予約が必要な案内）。
        </p>
        <p className="admin-menu-reservation-hint">
          保存した内容はサーバー（KV または REDIS）に書き込まれ、すべての端末の注文ページ・本日のメニューに同じ内容が表示されます。
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
          value={form.displaySection}
          onChange={(event) => setForm({ ...form, displaySection: event.target.value })}
          aria-label="表示セクション"
        >
          {DISPLAY_SECTION_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
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
          {MENU_IMAGE_OPTIONS.map(({ value, label }) => (
            <option key={value || '__none__'} value={value}>
              {label}
            </option>
          ))}
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
              value={item.price ?? ''}
              onChange={(event) => {
                const raw = event.target.value
                onUpdate(item.id, 'price', raw === '' ? '' : Number(raw))
              }}
            />
            <select
              value={item.displaySection || 'カリッと'}
              onChange={(event) => onUpdate(item.id, 'displaySection', event.target.value)}
              aria-label="表示セクション"
            >
              {DISPLAY_SECTION_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
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
              {MENU_IMAGE_OPTIONS.map(({ value, label }) => (
                <option key={value || '__none__'} value={value}>
                  {label}
                </option>
              ))}
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
