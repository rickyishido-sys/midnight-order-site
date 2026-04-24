import { useEffect, useMemo, useState } from 'react'
import { groupMenuItemsByDisplaySection } from '../utils/menuDisplaySections'
import { fetchMenuFromServer, loadMenuItems } from '../utils/menuStore'
import MenuCard from './MenuCard'
import SocialFollowRow from './SocialFollowRow'

const todayLabel = () => {
  const now = new Date()
  const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  return `${month} ${String(now.getDate()).padStart(2, '0')}`
}

function MenuPage() {
  const [items, setItems] = useState(loadMenuItems)
  const visibleItems = useMemo(() => items.filter((item) => item.enabled !== false), [items])
  const menuGroups = useMemo(() => groupMenuItemsByDisplaySection(visibleItems), [visibleItems])

  useEffect(() => {
    fetchMenuFromServer()
      .then(setItems)
      .catch(() => {})
  }, [])

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
        <div className="menu-public-groups">
          {menuGroups.map(({ section, items: groupItems }) => (
            <section
              className="menu-public-group"
              key={section}
              aria-labelledby={menuGroups.length > 1 ? `menu-sec-${section}` : undefined}
            >
              {menuGroups.length > 1 ? (
                <h2 className="menu-public-category-title" id={`menu-sec-${section}`}>
                  {section}
                </h2>
              ) : null}
              <div className="menu-grid">
                {groupItems.map((item) => (
                  <MenuCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <footer className="menu-footer">
        <SocialFollowRow tone="dark" className="menu-footer-social" />
        <p>© OHACO</p>
        <p>横浜市西区・中区・南区</p>
      </footer>
    </main>
  )
}

export default MenuPage
