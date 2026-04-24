import { useEffect, useState } from 'react'
import Header from './Header'
import SocialFollowRow from './SocialFollowRow'

const ORDER_URL = '/order'

function LandingPage() {
  const [heroScrolled, setHeroScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setHeroScrolled(window.scrollY > 32)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <main className="lp-page">
      <section className="hero">
        <div className="hero-bg" aria-hidden="true" />
        <div className="hero-overlay" aria-hidden="true" />
        <div className={`hero-top${heroScrolled ? ' hero-top--scrolled' : ''}`}>
          <Header />
        </div>
        <div className="hero-content">
          <p className="lp-lead">
            夜の街で働くあなたへ。温かくて美味しい食事を、LINEからご注文ください。会員には注文のたびに10%のキャッシュバックがあります。
          </p>
          <h1 className="lp-title">横浜一美味しい、深夜のデリバリー</h1>
          <p className="lp-copy">
            「美味しい」には、料理の味はもちろん、ご注文いただくお客さまにキャッシュバックが還ってくる〝おいしさ〟も込めています。OHACO（おはこ）は、横浜市中区・西区・南区に特化した深夜フードデリバリーです。
            注文するたびに10%のキャッシュバックが貯まるメンバー制サービスです。
          </p>
          <div className="lp-actions">
            <a className="lp-primary btn-primary" href={ORDER_URL}>
              LINEで注文する
            </a>
            <a className="lp-secondary btn-secondary" href="/menu">
              本日のメニューを見る
            </a>
            <a className="lp-secondary btn-secondary" href="#flow">
              利用の流れを見る
            </a>
          </div>
        </div>
      </section>

      <div className="lp-below">
        <section className="lp-section glass" id="value">
          <p className="section-eyebrow">VALUE</p>
          <h2 className="lp-section-title">OHACOが選ばれる3つの理由</h2>
          <div className="lp-card-grid">
            <article className="lp-card">
              <h3>注文するたびに10%キャッシュバック</h3>
              <p>ご注文金額の10%を常にキャッシュバック。貯まった残高はPayPayや銀行振込で受け取れます。</p>
            </article>
            <article className="lp-card">
              <h3>LINEで簡単に注文</h3>
              <p>
                専用アプリは不要。いつものLINEからメニューを選んで送信するだけ。お届けまでの時間は、ご注文内容や交通の混み具合によって前後することがあります。
              </p>
            </article>
            <article className="lp-card">
              <h3>横浜一美味しい、こだわりの味</h3>
              <p>
                舌で感じるおいしさに加え、会員には注文ごとに10%が戻る〝お客さまにとってのおいしさ〟もセットで。深夜でも妥協しない温かい食事をお届けし、差し入れやスタッフのまかないにも最適です。
              </p>
            </article>
          </div>
        </section>

        <section className="lp-section glass" id="pricing">
          <p className="section-eyebrow">PRICING</p>
          <h2 className="lp-section-title">料金の目安</h2>
          <div className="lp-pricing">
            <div>
              <span>最低注文金額</span>
              <strong>¥3,000</strong>
            </div>
            <div>
              <span>配達料</span>
              <strong>¥1,000</strong>
            </div>
            <div>
              <span>注文者キャッシュバック</span>
              <strong>¥300</strong>
            </div>
          </div>
          <p className="lp-note">※ 最低注文¥3,000以上で受付しています。</p>
        </section>

        <section className="lp-section glass" id="flow">
          <p className="section-eyebrow">FLOW</p>
          <h2 className="lp-section-title">導入から注文までの流れ</h2>
          <ol className="lp-flow">
            <li>LINEで「OHACO」を友だち追加（最新情報は Instagram @ohaco.yokohama でも）</li>
            <li>リッチメニューから注文ページを開き、商品をカートに入れて送信</li>
            <li>温かいお食事をお届け（お届けまでの時間は状況により前後します）</li>
          </ol>
          <a className="lp-inline-cta btn-line" href={ORDER_URL}>
            LINEで注文を送る
          </a>
        </section>

        <section className="lp-section glass lp-area" id="area">
          <p className="section-eyebrow">SERVICE AREA</p>
          <h2 className="lp-section-title">対応エリア</h2>
          <p>現在は横浜市西区・中区・南区のみ対応しています。</p>
        </section>

        <section className="lp-section glass lp-social" id="sns">
          <p className="section-eyebrow">SNS</p>
          <h2 className="lp-section-title">公式アカウント</h2>
          <p className="lp-social-copy">メニューや雰囲気の更新は Instagram から。友だち追加・注文は LINE からどうぞ。</p>
          <SocialFollowRow tone="light" className="lp-social-icons" />
        </section>

        <a className="lp-fixed-order btn-primary" href={ORDER_URL}>
          注文ページを開く
        </a>
        <a className="lp-admin-link" href="/admin">
          管理画面
        </a>
      </div>
    </main>
  )
}

export default LandingPage
