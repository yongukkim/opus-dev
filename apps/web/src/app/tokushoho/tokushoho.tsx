/**
 * 特定商取引法に基づく表記（案）— 実運用前に法務・税務で最終確認すること。
 * Specified Commercial Transaction Act (Japan) — draft placeholders only.
 */
export function TokushohoContent() {
  return (
    <article className="max-w-none">
      <h1 className="font-display text-3xl text-opus-warm">特定商取引法に基づく表記</h1>
      <p className="mt-2 text-sm text-opus-warm/70">
        以下の項目はテンプレートです。事業者情報を確定し、公開前に必ず更新してください。
      </p>
      <p className="mt-3 border-l border-opus-gold/35 pl-3 text-xs leading-relaxed text-opus-warm/55">
        本サービスはNFT技術を用いた複製不可デジタルアートの提供・保有体験を目的とし、実物資産または投資商品としての勧誘を目的としません。
      </p>

      <section className="mt-10 space-y-8">
        <div>
          <h2 className="font-display text-xl text-opus-warm">販売事業者名</h2>
          <p className="mt-2 text-opus-warm/75">（正式名称を記載）</p>
        </div>
        <div>
          <h2 className="font-display text-xl text-opus-warm">運営責任者</h2>
          <p className="mt-2 text-opus-warm/75">（氏名を記載）</p>
        </div>
        <div>
          <h2 className="font-display text-xl text-opus-warm">所在地</h2>
          <p className="mt-2 text-opus-warm/75">
            （請求があった場合に遅滞なく開示できる住所を記載）
          </p>
        </div>
        <div>
          <h2 className="font-display text-xl text-opus-warm">電話番号</h2>
          <p className="mt-2 text-opus-warm/75">
            （顧客からの連絡用。公開に支障がある場合は、請求時の遅滞なく開示できる旨を併記）
          </p>
        </div>
        <div>
          <h2 className="font-display text-xl text-opus-warm">メールアドレス</h2>
          <p className="mt-2 text-opus-warm/75">（問い合わせ窓口）</p>
        </div>
        <div>
          <h2 className="font-display text-xl text-opus-warm">商品代金以外に必要な費用</h2>
          <p className="mt-2 text-opus-warm/75">
            （消費税、送料、決済手数料、ダウンロード通信料等があれば具体的に記載）
          </p>
        </div>
        <div>
          <h2 className="font-display text-xl text-opus-warm">代金の支払時期および方法</h2>
          <p className="mt-2 text-opus-warm/75">
            （クレジットカード決済、請求書払い等、決済サービス名とタイミングを記載）
          </p>
        </div>
        <div>
          <h2 className="font-display text-xl text-opus-warm">商品の引渡時期</h2>
          <p className="mt-2 text-opus-warm/75">
            （デジタルコンテンツの提供方法・即時/日時、物理商品の場合は発送目安）
          </p>
        </div>
        <div>
          <h2 className="font-display text-xl text-opus-warm">返品・キャンセル・不良品について</h2>
          <p className="mt-2 text-opus-warm/75">
            デジタル商品の性質に応じた特約（例：ダウンロード開始後の返品不可等）を、法令に照らして明記してください。
          </p>
        </div>
        <div>
          <h2 className="font-display text-xl text-opus-warm">動作環境</h2>
          <p className="mt-2 text-opus-warm/75">
            （推奨OS・ブラウザ、モバイルアプリの対応バージョン等）
          </p>
        </div>
      </section>
    </article>
  );
}
