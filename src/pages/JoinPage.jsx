import { brandSocial } from '../config/brandSocial'

function JoinPage() {
  return (
    <main className="join-page">
      <section className="join-hero">
        <div className="join-hero-bg" aria-hidden="true" />
        <div className="join-hero-overlay" aria-hidden="true" />
        <div className="join-hero-content">
          <img className="join-logo" src="/images/ohaco-logo.png" alt="OHACO" />
          <h1>横浜一美味しい深夜デリバリー</h1>
          <p>
            「美味しい」は味だけでなく、会員向けキャッシュバックのお得さも。深夜帯の「今すぐ必要」を止めない配達です。
          </p>
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
        <div className="join-sticky-stack">
          <a className="btn-line" href={brandSocial.lineFriend} target="_blank" rel="noreferrer">
            LINEで友だち追加してメンバーになる
          </a>
          <a className="btn-instagram-outline" href={brandSocial.instagram} target="_blank" rel="noreferrer">
            Instagram をフォロー（@ohaco.yokohama）
          </a>
        </div>
      </div>
    </main>
  )
}

export default JoinPage
