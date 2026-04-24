function Header() {
  return (
    <header className="header glass-gold">
      <div className="brand-wrap">
        <img
          className="brand-logo"
          src="/images/ohaco-logo.png"
          alt="OHACO"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
            const fallback = event.currentTarget.nextElementSibling
            if (fallback) fallback.style.display = 'block'
          }}
        />
        <p className="brand-logo-fallback">OHACO</p>
        <p className="brand-main">法人・店舗向け 配達オーダー</p>
      </div>
      <div className="header-meta">
        <span className="time-badge">10%キャッシュバック</span>
        <span className="service-area">横浜市西区・中区・南区</span>
      </div>
    </header>
  )
}

export default Header
