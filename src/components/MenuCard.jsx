import { RESERVATION_BADGE, RESERVATION_NOTE } from '../utils/reservationCopy'

function MenuCard({ item }) {
  const imageKey = item.imageKey || 'default'
  const imageSrc = `/images/menu/${imageKey}.png`

  return (
    <article className="menu-public-card">
      <div className="menu-public-card-image-wrap">
        <img
          src={imageSrc}
          alt={item.name}
          onError={(event) => {
            event.currentTarget.src = `/images/menu/${imageKey}.jpg`
          }}
        />
      </div>
      <div className="menu-public-card-body">
        <h3 className="menu-public-card-name">{item.name}</h3>
        {item.description ? <p className="menu-public-card-desc">{item.description}</p> : null}
        {item.requiresReservation ? (
          <div className="menu-public-reservation">
            <span className="menu-public-reservation-badge">{RESERVATION_BADGE}</span>
            <p className="menu-public-reservation-note">{RESERVATION_NOTE}</p>
          </div>
        ) : null}
        <p className="menu-public-card-price">¥{Number(item.price).toLocaleString()}</p>
      </div>
    </article>
  )
}

export default MenuCard
