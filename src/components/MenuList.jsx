import { groupMenuItemsByDisplaySection } from '../utils/menuDisplaySections'
import { getMenuImageUrl } from '../utils/menuImage'
import { RESERVATION_BADGE, RESERVATION_NOTE } from '../utils/reservationCopy'

const toYen = (value) => `¥${value.toLocaleString()}`

function MenuList({ items, quantities, onAdjust }) {
  const groups = groupMenuItemsByDisplaySection(items)

  return (
    <section className="menu">
      <div className="section-head menu-head">
        <p className="section-eyebrow">MENU SELECT</p>
        <p className="section-title">メニュー</p>
      </div>

      {groups.map(({ section, items: groupItems }) => (
        <div className="menu-category-block" key={section}>
          {groups.length > 1 ? <h3 className="menu-category-title">{section}</h3> : null}
          <div className="menu-category-items">
            {groupItems.map((item) => {
              const qty = quantities[item.id] ?? 0
              const isActive = qty > 0
              return (
                <article className={`menu-card glass ${isActive ? 'menu-card-active' : ''}`} key={item.id}>
                  <div className="menu-card-left">
                    <div className="menu-thumb">
                      <img
                        src={getMenuImageUrl(item.name)}
                        alt={`${item.name}のイメージ`}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                    <div>
                      <p className="menu-name">{item.name}</p>
                      <p className="menu-price">{toYen(item.price)}</p>
                      {item.requiresReservation ? (
                        <>
                          <div className="menu-reservation-row">
                            <span className="menu-reservation-badge">{RESERVATION_BADGE}</span>
                          </div>
                          <p className="menu-reservation-note">{RESERVATION_NOTE}</p>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="qty-control">
                    <button type="button" className="qty-minus" onClick={() => onAdjust(item.id, -1)}>
                      -
                    </button>
                    <span className={isActive ? 'qty-active' : ''}>{qty}</span>
                    <button type="button" className="qty-plus" onClick={() => onAdjust(item.id, 1)}>
                      +
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      ))}
    </section>
  )
}

export default MenuList
