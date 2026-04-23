import { useMemo, useState } from 'react'
import { loadMenuItems } from '../utils/menuStore'
import MenuCard from './MenuCard'

const todayLabel = () => {
  const now = new Date()
  const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  return `${month} ${String(now.getDate()).padStart(2, '0')}`
}

function MenuPage() {
  const [items] = useState(loadMenuItems)
  const visibleItems = useMemo(() => items.filter((item) => item.enabled !== false), [items])

  return (
    <main className="menu-public-page">
      <header className="menu-header">
        <div className="menu-header-logo">
          <img src="/images/ohaco-logo.png" alt="OHACO" />
        </div>
        <div className="menu-header-date">{todayLabel()}</div>
      </header>
      <nav className="menu-nav-links" aria-label="page links">
        <a href="/">トップへ</a>
        <a href="/order">注文ページへ</a>
      </nav>
      <div className="menu-section-label">TODAY&apos;S MENU</div>

      {visibleItems.length === 0 ? (
        <div className="menu-empty">
          <p>本日のメニューは準備中です</p>
        </div>
      ) : (
        <section className="menu-grid">
          {visibleItems.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </section>
      )}

      <footer className="menu-footer">
        <p>© OHACO</p>
        <p>横浜市西区・中区・南区</p>
      </footer>
    </main>
  )
}

export default MenuPage
