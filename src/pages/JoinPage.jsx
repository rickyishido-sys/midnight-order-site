function JoinPage() {
  return (
    <main className="join-page">
      <section className="join-hero">
        <div className="join-hero-bg" aria-hidden="true" />
        <div className="join-hero-overlay" aria-hidden="true" />
        <div className="join-hero-content">
          <img className="join-logo" src="/images/ohaco-logo.png" alt="OHACO" />
          <h1>横浜一美味しい深夜デリバリー</h1>
          <p>深夜帯の「今すぐ必要」を止めない配達サービス</p>
        </div>
      </section>

      <section className="join-value">
        <p className="section-eyebrow">VALUE</p>
        <div className="join-value-list">
          <article className="join-value-card join-value-card-strong glass">
            <h2>注文するたびに10%キャッシュバック</h2>
          </article>
          <article className="join-value-card glass">
            <h2>LINEで簡単注文・決済</h2>
          </article>
          <article className="join-value-card glass">
            <h2>横浜中区・西区・南区エリア対応</h2>
          </article>
        </div>
      </section>

      <div className="join-sticky-cta">
        <a className="btn-line" href="https://line.me/ti/p/@349nlxlw" target="_blank" rel="noreferrer">
          LINEで友だち追加してメンバーになる
        </a>
      </div>
    </main>
  )
}

export default JoinPage
