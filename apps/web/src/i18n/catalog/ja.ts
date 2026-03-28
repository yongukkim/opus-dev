import type { Messages } from "../types";

export const ja: Messages = {
  meta: {
    siteDescription:
      "OPUS — 認証された代替不可能なデジタルアート・エディションとThe Chronicle。収集・鑑賞の体験のために設計され、投資商品ではありません。",
    ogDescription:
      "プレミアム・デジタルアート・アーカイブ — チャコール、シャンパン・ブラス、来歴とVault。投資商品ではありません。",
    tokushohoTitle: "特定商取引法に基づく表記",
    tokushohoDescription:
      "特定商取引法に基づく表記（案）。法務・税務で最終確認のうえ公開してください。",
    privacyTitle: "プライバシーポリシー",
    privacyDescription:
      "OPUSのプライバシーポリシー（案）。法務確認およびAPPI整合のうえ公開してください。",
    termsTitle: "利用規約",
    termsDescription:
      "OPUSの利用規約（案）。法務で最終確定のうえ公開してください。",
  },
  a11y: {
    primaryNav: "主要ナビゲーション",
    utilityNav: "ユーティリティ",
    language: "言語",
    vaultNav: "Vaultナビゲーション",
    designPhilosophy: "デザイン哲学",
    hero: "OPUSヒーロー",
    stats: "信頼指標",
    cta: "行動喚起",
    archivePreview: "アーカイブプレビュー",
  },
  nav: { archive: "アーカイブ", vault: "Vault", legal: "法的情報" },
  auth: {
    signIn: "ログイン",
    title: "ログイン",
    subtitle: "利用者は Apple / Google / LINE で開始します。",
    roleLabel: "ログイン種別",
    roleCollector: "利用者",
    roleArtist: "作家",
    continueWithApple: "Appleで続行",
    continueWithGoogle: "Googleで続行",
    continueWithLine: "LINEで続行",
    hintSoon: "準備中",
    consentPreamble: "続行すると、",
    consentBetween: " および ",
    consentConclude: "に同意したものとみなされます。",
    ageCheckbox: "私は18歳以上です。",
    consentRequiredAlert:
      "18歳以上であること、および利用規約・プライバシーポリシーへの同意を確認してください。",
    ssoNotReadyAlert: "SSO連携は準備中です。近日対応予定です。",
    note: "現在はUIのみです。実連携は次の段階で追加します。",
  },
  signup: {
    title: "作家登録",
    subtitle: "作品提出のため、作家アカウントは別途登録フローで進めます。",
    roleLabel: "登録種別",
    roleCollector: "利用者",
    roleArtist: "作家",
    displayNameLabel: "表示名",
    emailLabel: "メールアドレス",
    passwordLabel: "パスワード",
    passwordConfirmLabel: "パスワード（確認）",
    passwordMismatchAlert: "パスワードと確認用パスワードが一致しません。",
    createAccount: "作家アカウント作成",
    consentPreamble: "登録手続きを進めると、",
    signupNotReadyAlert: "作家登録の受付は準備中です。近日対応予定です。",
    alreadyHaveAccount: "すでにアカウントをお持ちですか？",
    signInLink: "ログイン",
    note: "現在はUIのみです。登録/検証は次の段階で追加します。",
  },
  trust: {
    line: "認定版 · 来歴 · 非投資商品",
    tokushoho: "特定商取引法に基づく表記",
    chronicle: "The Chronicle",
    vaultShort: "Vault",
  },
  footer: {
    about:
      "デジタル名作のアーカイブ — 認定エディション、コレクターの来歴、Vault。",
    design:
      "デザイン: Classic Luxury — near-blackチャコール、シャンパン・ブラス（グラデーションの金属）、ウォームホワイト、抑制された装飾。投資・実物資産商品ではありません。",
    archive: "アーカイブ",
    vault: "Vault",
    legal: "特定商取引法に基づく表記",
    privacy: "プライバシーポリシー",
    terms: "利用規約",
    chronicleTrust: "The Chronicle Technology による検証",
  },
  legalPrivacy: {
    back: "← トップへ",
    title: "プライバシーポリシー",
    lead: "日本市場・M&A実務上のデューデリジェンス（DD）および個人情報保護法（APPI）を踏まえた草案です。法務確定後に更新してください。",
    body:
      "取得する個人情報の項目、利用目的、保管期間、第三者提供・再委託、国外移転、開示等の請求、問い合わせ窓口、安全管理措置を定めます。本番環境のシステム・ログ・暗号化方針と一致させてください。",
  },
  legalTerms: {
    back: "← トップへ",
    title: "利用規約",
    lead: "認証されたデジタルアート・エディションの体験を規定します。投資・金融商品としての位置づけを目的としません。",
    body:
      "サービス範囲、アカウントと役割（作家・利用者・運営）、著作権・ライセンス、The Chronicleの記録、禁止事項、責任制限、準拠法・紛争解決を定めます。NFTは技術的手段であり、複製不可デジタルアートの真正性・エディション表示のためのものです。",
  },
  vaultNav: {
    overview: "概要",
    collection: "コレクション",
    activity: "アクティビティ",
    submit: "作品登録",
    myArtworks: "自分の作品",
    settings: "設定",
  },
  submitArtwork: {
    kicker: "Artist",
    title: "作品登録",
    subtitle: "作家公式登録に必要な基本情報を入力し、ファイルをアップロードしてください。",
    artistNameLabel: "作家名（実名）",
    nicknameLabel: "筆名",
    artworkTitleLabel: "作品タイトル",
    genreLabel: "ジャンル",
    genrePlaceholder: "ジャンルを選択",
    yearLabel: "制作年",
    descriptionLabel: "作品説明",
    tagsLabel: "タグ",
    tagsHint: "カンマ区切り（例: abstract, monochrome, portrait）",
    editionModeLabel: "エディションタイプ",
    editionModeUnique: "ユニーク（1/1）",
    editionModeLimited: "限定版（複数エディション）",
    editionTotalLabel: "総エディション数",
    editionTotalHint: "最大20部まで設定できます。",
    initialMintLabel: "初回発行数",
    initialMintHint: "初回公開時に発行する数量です。総エディション数を超えられません。",
    numberingPolicyLabel: "エディション番号ポリシー",
    numberingPolicyAuto: "自動付与",
    numberingPolicyManual: "手動指定",
    lockEditionLabel: "総エディション数をロック",
    lockEditionHint: "提出後の総エディション数変更を制限します。",
    rightsConfirmLabel: "権利の確認",
    rightsConfirmHint: "本作品の権利を保有、またはアップロード許可があることを確認します。",
    uploadLabel: "ファイルアップロード",
    uploadHint: "画像（JPG/PNG/WEBP）または動画（MP4/WEBM）。最大10MB。",
    apiSaveOk: "保存しました。アーカイブで確認できます。",
    apiSaveErr: "保存に失敗しました。入力内容とファイルをご確認ください。",
    saveDraft: "下書きを保存",
    submit: "提出",
    previewTitle: "プレビュー",
  },
  hero: {
    kicker: "認証された代替不可能なデジタルアート・エディション",
    line1:
      "コピーではない、あなただけの「デジタル原画」。作家公式の認定を、プライベートなVaultへ。",
    line2:
      "デジタル名作のアーカイブ — 真正性、エディション、コレクターの来歴が一つの記録に。",
    exploreArchive: "アーカイブを見る",
    viewPremieres: "プレミアを見る",
  },
  design: {
    title: "Classic Luxury",
    body:
      "near-blackのキャンバスに、彩度を抑えたシャンパン・ブラス（明るい黄銅）をアクセントとして配す。CTAなど金属面は、多段のグラデーションとごく薄いハイライト／陰影だけで光の向きと質感を示し、原色の金やネオン、安価な光沢表現は用いない。",
    note:
      "本サービスは複製不可デジタルアートの収集体験を目的とし、実物資産や投資商品としての位置づけは行いません。",
  },
  home: {
    kicker: "OPUS",
    title: "写真とコレクションのための場所",
    lead: "決済・案内はこのサイトで。作品の鑑賞はモバイルアプリから。",
    buyCta: "購入・決済へ",
    legalLink: "特定商取引法に基づく表記",
    pillarChronicle: {
      sub: "改ざん耐性のある履歴",
      body: "所有と版の連鎖を一つの記録に。鑑定とエディションを明確に残します。",
    },
    pillarVault: {
      sub: "プライベート保管",
      body: "コレクションの所在とアクセスを、役割に応じて最小権限で制御します。",
    },
    pillarPremieres: {
      sub: "公式認定の作品",
      body: "作家公式の認定と限定版。モバイルで鑑賞、ウェブで手続きと決済。",
    },
  },
  stats: {
    weekBest: "今週のベスト",
    monthBest: "今月のベスト",
    yearBest: "今年のベスト",
    caption: "選定基準は運営ポリシーにより変更される場合があります。",
  },
  archiveGrid: {
    kicker: "Archive preview",
    heading: "From the vault",
    body:
      "作家公式の認定版から、注目エディションを先行表示します。各カードで来歴と版情報を確認できます。",
    viewAll: "すべて表示",
    artwork: "Artwork",
  },
  marketing: {
    title: "コレクションを、公式の記録とともに。",
    body:
      "アーカイブの閲覧、Vaultの管理、決済はウェブから。鑑賞はアプリで。実物資産の投資商品ではなく、複製不可デジタルアートの体験を提供します。",
    buy: "購入・決済へ",
    openVault: "Vaultを開く",
  },
  artworks: {
    kicker: "Archive",
    title: "Artworks",
    body:
      "認定済みデジタルアートの一覧をここから閲覧できます。各作品ページで来歴・エディション情報を確認してください。",
    back: "← トップへ",
    editionLabel: "Edition:",
    paginationPrev: "前へ",
    paginationNext: "次へ",
    paginationPageOf: "{current} / {total} ページ",
  },
  artistArtworks: {
    title: "Artworks",
    body: "登録した作品一覧です。サムネイルは本人が所有する作品のみサーバーから提供されます。",
    empty: "表示する登録作品がありません。登録完了と、以下の作家IDが正しいかご確認ください。",
    devHint:
      "開発用: URLに ?artist=作家ID を付けると、そのIDで登録された作品を読み込みます（作品登録フォームの Actor userId など）。",
    backVault: "← Vaultへ",
    backHome: "← トップへ",
  },
  vault: {
    overviewKicker: "Vault",
    overviewTitle: "概要",
    overviewBody:
      "プライベート保管中のコレクション状態、通知、Chronicleの更新履歴をこの画面で確認します。",
    balance: "残高",
    activeBids: "進行中の入札",
    collectionTitle: "コレクション",
    collectionBody: "保有エディション一覧のプレースホルダ。",
    activityTitle: "アクティビティ",
    activityBody: "入札・決済・Chronicleイベントのプレースホルダ。",
    settingsTitle: "設定",
    settingsBody: "アカウント・通知・セキュリティのプレースホルダ。",
  },
  tokushoho: {
    back: "← トップへ",
    h1: "特定商取引法に基づく表記",
    statutory: "特定商取引法に基づく表記",
    intro:
      "以下の項目はテンプレートです。事業者情報を確定し、公開前に必ず更新してください。",
    nftNote:
      "本サービスはNFT技術を用いた複製不可デジタルアートの提供・保有体験を目的とし、実物資産または投資商品としての勧誘を目的としません。",
    sections: {
      sellerName: {
        title: "販売事業者名",
        hint: "（正式名称を記載）",
      },
      operator: { title: "運営責任者", hint: "（氏名を記載）" },
      address: {
        title: "所在地",
        hint: "（請求があった場合に遅滞なく開示できる住所を記載）",
      },
      phone: {
        title: "電話番号",
        hint: "（顧客からの連絡用。公開に支障がある場合は、請求時の遅滞なく開示できる旨を併記）",
      },
      email: { title: "メールアドレス", hint: "（問い合わせ窓口）" },
      extraFees: {
        title: "商品代金以外に必要な費用",
        hint: "（消費税、送料、決済手数料、ダウンロード通信料等があれば具体的に記載）",
      },
      payment: {
        title: "代金の支払時期および方法",
        hint: "（クレジットカード決済、請求書払い等、決済サービス名とタイミングを記載）",
      },
      delivery: {
        title: "商品の引渡時期",
        hint: "（デジタルコンテンツの提供方法・即時/日時、物理商品の場合は発送目安）",
      },
      returns: {
        title: "返品・キャンセル・不良品について",
        hint: "デジタル商品の性質に応じた特約を、法令に照らして明記してください。",
      },
      env: {
        title: "動作環境",
        hint: "（推奨OS・ブラウザ、モバイルアプリの対応バージョン等）",
      },
    },
  },
};
