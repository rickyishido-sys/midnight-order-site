import { getMenuImageUrl } from '../utils/menuImage'

const toYen = (value) => `¥${value.toLocaleString()}`

function MenuList({ items, quantities, onAdjust }) {
  return (
    <section className="menu">
      <div className="section-head menu-head">
        <p className="section-eyebrow">MENU SELECT</p>
        <p className="section-title">メニュー</p>
      </div>

      {items.map((item) => {
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
    </section>
  )
}

export default MenuList
