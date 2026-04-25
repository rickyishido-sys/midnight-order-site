function InputSection({
  storeName,
  lineName,
  zipCode,
  address,
  reservationDate,
  hasReservationItems,
  note,
  onChangeField,
  onLookupZip,
  zipLoading,
  zipError,
  hasLastOrder,
  onRestoreLastOrder,
  cashbackMethod,
  cashbackPaypayId,
  cashbackBankInfo,
  paymentMethod,
}) {
  return (
    <section className="panel glass">
      <div className="section-head">
        <p className="section-eyebrow">CUSTOMER INFO</p>
        <p className="section-title">お客様情報</p>
        <p className="section-limit">配達対象: 横浜市中区・南区・西区</p>
      </div>

      {hasLastOrder && (
        <button type="button" className="restore-button" onClick={onRestoreLastOrder}>
          前回の注文内容を復元
        </button>
      )}

      <label className="field">
        <span>お届け先（店舗名または氏名）</span>
        <input
          type="text"
          value={storeName}
          onChange={(e) => onChangeField('storeName', e.target.value)}
          placeholder="例：OHACO / 山田太郎"
        />
      </label>

      <label className="field">
        <span>発注者LINE名（表示名またはLINE ID）</span>
        <input
          type="text"
          value={lineName}
          onChange={(e) => onChangeField('lineName', e.target.value)}
          placeholder="例：山田"
        />
      </label>

      <label className="field">
        <span>郵便番号</span>
        <small className="field-help">現在の配達エリアは、横浜市中区・西区・南区のみです。</small>
        <div className="zip-row">
          <input
            type="text"
            value={zipCode}
            onChange={(e) => onChangeField('zipCode', e.target.value)}
            placeholder="例：2310016"
            inputMode="numeric"
            maxLength={8}
          />
          <button type="button" className="zip-button" onClick={onLookupZip} disabled={zipLoading}>
            {zipLoading ? '検索中' : '住所検索'}
          </button>
        </div>
        {zipError && <small className="zip-error">{zipError}</small>}
      </label>

      {hasReservationItems ? (
        <label className="field">
          <span>要予約商品の希望お届け日</span>
          <input
            type="date"
            value={reservationDate}
            onChange={(e) => onChangeField('reservationDate', e.target.value)}
          />
          <small className="field-help">要予約商品は前日16:00までにご予約ください。</small>
        </label>
      ) : null}

      <label className="field">
        <span>住所</span>
        <input
          type="text"
          value={address}
          onChange={(e) => onChangeField('address', e.target.value)}
          placeholder="住所を入力"
        />
      </label>

      <label className="field">
        <span>備考</span>
        <textarea
          value={note}
          onChange={(e) => onChangeField('note', e.target.value)}
          placeholder="配達場所の詳細など"
          rows={3}
        />
      </label>

      <div className="field">
        <span>決済方法</span>
        <select
          value={paymentMethod}
          onChange={(e) => onChangeField('paymentMethod', e.target.value)}
        >
          <option value="cash">現地払い</option>
          <option value="square">オンライン決済（クレカ / PayPay / 交通系 など）</option>
        </select>
        <small className="payment-note">※利用可能な支払い方法は決済画面で選択できます。</small>
      </div>

      <div className="field">
        <span>キャッシュバック受取方法</span>
        <select
          value={cashbackMethod}
          onChange={(e) => onChangeField('cashbackMethod', e.target.value)}
        >
          <option value="next_discount">次回値引き</option>
          <option value="paypay">PayPay送金</option>
          <option value="bank">銀行振込（高額時）</option>
        </select>
      </div>

      {cashbackMethod === 'paypay' && (
        <label className="field">
          <span>PayPay ID / 電話番号</span>
          <input
            type="text"
            value={cashbackPaypayId}
            onChange={(e) => onChangeField('cashbackPaypayId', e.target.value)}
            placeholder="例：paypay_id または 09012345678"
          />
        </label>
      )}

      {cashbackMethod === 'bank' && (
        <label className="field">
          <span>振込先情報（銀行/支店/口座/名義）</span>
          <textarea
            value={cashbackBankInfo}
            onChange={(e) => onChangeField('cashbackBankInfo', e.target.value)}
            placeholder="例：○○銀行 ○○支店 普通 1234567 ヤマダタロウ"
            rows={2}
          />
        </label>
      )}
    </section>
  )
}

export default InputSection
