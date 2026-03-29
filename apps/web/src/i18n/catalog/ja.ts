import type { Messages } from "../types";

export const ja: Messages = {
  meta: {
    siteDescription:
      "OPUSは、認証された代替不可能なデジタルアート・エディションとThe Chronicleを提供します。収集・鑑賞の体験のために設計されており、投資商品ではありません。",
    ogDescription:
      "プレミアム・デジタルアート・アーカイブです。チャコール、シャンパン・ブラス、来歴とVaultを備え、投資商品ではありません。",
    tokushohoTitle: "特定商取引法に基づく表記",
    tokushohoDescription:
      "特定商取引法に基づく表記（案）です。法務・税務で最終確認のうえ、公開してください。",
    privacyTitle: "プライバシーポリシー",
    privacyDescription:
      "OPUSのプライバシーポリシー（案）です。法務確認およびAPPI整合のうえ、公開してください。",
    termsTitle: "利用規約",
    termsDescription:
      "OPUSの利用規約（案）です。法務で最終確定のうえ、公開してください。",
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
    subtitle: "利用者の方は、Apple / Google / LINE から開始できます。",
    roleLabel: "ログイン種別",
    roleCollector: "利用者",
    roleArtist: "作家",
    continueWithApple: "Appleで続ける",
    continueWithGoogle: "Googleで続ける",
    continueWithLine: "LINEで続ける",
    hintSoon: "準備中",
    consentPreamble: "続行すると、",
    consentBetween: " および ",
    consentConclude: "に同意したものとみなされます。",
    ageCheckbox: "私は18歳以上です。",
    consentRequiredAlert:
      "18歳以上であること、および利用規約・プライバシーポリシーへの同意を確認してください。",
    ssoNotReadyAlert: "SSO連携は現在準備中です。近日中に対応予定です。",
    note: "現在はUIのみを提供しています。実連携は次の段階で追加します。",
  },
  signup: {
    title: "作家登録",
    subtitle:
      "作品提出のため、作家アカウントは別途の登録フローで進めていただきます。",
    roleLabel: "登録種別",
    roleCollector: "利用者",
    roleArtist: "作家",
    displayNameLabel: "表示名",
    emailLabel: "メールアドレス",
    passwordLabel: "パスワード",
    passwordConfirmLabel: "パスワード（確認）",
    passwordMismatchAlert: "パスワードと確認用パスワードが一致しません。",
    createAccount: "作家アカウントを作成する",
    consentPreamble: "登録手続きを進めると、",
    signupNotReadyAlert: "作家登録の受付は現在準備中です。近日中に対応予定です。",
    alreadyHaveAccount: "すでにアカウントをお持ちですか？",
    signInLink: "ログイン",
    note: "現在はUIのみを提供しています。登録・検証は次の段階で追加します。",
  },
  trust: {
    line: "認定版 · 来歴 · 非投資商品",
    tokushoho: "特定商取引法に基づく表記",
    chronicle: "The Chronicle",
    vaultShort: "Vault",
  },
  footer: {
    about:
      "デジタル名作のアーカイブです。認定エディション、コレクターの来歴、Vaultをご利用いただけます。",
    design:
      "デザインはClassic Luxuryです。near-blackのチャコール、シャンパン・ブラス（グラデーションの金属表現）、ウォームホワイト、抑制された装飾を用います。投資・実物資産商品ではありません。",
    archive: "アーカイブ",
    vault: "Vault",
    legal: "特定商取引法に基づく表記",
    privacy: "プライバシーポリシー",
    terms: "利用規約",
    chronicleTrust: "The Chronicle Technology により検証されています。",
  },
  legalPrivacy: {
    back: "← トップへ",
    title: "プライバシーポリシー",
    lead:
      "本ページは、日本市場・M&A実務上のデューデリジェンス（DD）および個人情報保護法（APPI）を踏まえた草案です。法務確定後に更新してください。",
    body:
      "取得する個人情報の項目、利用目的、保管期間、第三者提供・再委託、国外移転、開示等の請求、問い合わせ窓口、安全管理措置を定めます。本番環境のシステム・ログ・暗号化方針と一致させてください。",
  },
  legalTerms: {
    back: "← トップへ",
    title: "利用規約",
    lead:
      "認証されたデジタルアート・エディションの体験を規定します。投資・金融商品としての位置づけを目的とはしません。",
    body:
      "サービス範囲、アカウントと役割（作家・利用者・運営）、著作権・ライセンス、The Chronicleの記録、禁止事項、責任制限、準拠法・紛争解決を定めます。NFTは技術的手段であり、複製不可デジタルアートの真正性・エディション表示のために用います。",
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
    subtitle:
      "作家公式登録に必要な基本情報を入力し、ファイルをアップロードしてください。",
    artistNameLabel: "作家名（実名）",
    nicknameLabel: "筆名",
    artworkTitleLabel: "作品タイトル",
    genreLabel: "ジャンル",
    genrePlaceholder: "ジャンルを選択してください",
    yearLabel: "制作年",
    descriptionLabel: "作品説明",
    tagsLabel: "タグ",
    tagsHint: "カンマ区切りで入力してください（例: abstract, monochrome, portrait）",
    editionModeLabel: "エディションタイプ",
    editionModeUnique: "ユニーク（1/1）",
    editionModeLimited: "限定版（複数エディション）",
    editionTotalLabel: "総エディション数",
    editionTotalHint: "最大20部まで設定できます。",
    initialMintLabel: "初回発行数",
    initialMintHint:
      "初回公開時に発行する数量です。総エディション数を超えることはできません。",
    numberingPolicyLabel: "エディション番号ポリシー",
    numberingPolicyAuto: "自動付与",
    numberingPolicyManual: "手動指定",
    lockEditionLabel: "総エディション数をロックする",
    lockEditionHint: "提出後の総エディション数変更を制限します。",
    rightsConfirmLabel: "権利の確認",
    rightsConfirmHint:
      "本作品の権利を保有しているか、またはアップロードの許可を得ていることを確認してください。",
    uploadLabel: "ファイルアップロード",
    uploadHint:
      "画像（JPG/PNG/WEBP）または動画（MP4/WEBM）をアップロードできます。最大10MBです。",
    apiSaveOk: "保存しました。アーカイブで確認できます。",
    apiSaveErr: "保存に失敗しました。入力内容とファイルをご確認ください。",
    saveDraft: "下書きを保存する",
    submit: "提出する",
    previewTitle: "プレビュー",
  },
  hero: {
    kicker: "認証された代替不可能なデジタルアート・エディション",
    line1:
      "コピーではなく、あなただけの「デジタル原画」です。作家公式の認定を、プライベートなVaultへ。",
    line2:
      "デジタル名作のアーカイブです。真正性、エディション、コレクターの来歴が一つの記録にまとまります。",
    exploreArchive: "アーカイブを探求する",
    viewPremieres: "プレミアを見る",
  },
  design: {
    title: "Classic Luxury",
    body:
      "near-blackのキャンバスに、彩度を抑えたシャンパン・ブラス（明るい黄銅）をアクセントとして配します。CTAなどの金属面は、多段のグラデーションとごく薄いハイライト／陰影のみで光の向きと質感を示し、原色の金やネオン、安価な光沢表現は用いません。",
    note:
      "本サービスは複製不可デジタルアートの収集体験を目的としており、実物資産や投資商品として位置づけるものではありません。",
  },
  home: {
    kicker: "OPUS",
    title: "写真とコレクションのための場所",
    lead: "決済・案内は本サイトで行い、作品の鑑賞はモバイルアプリから行えます。",
    buyCta: "購入・決済へ進む",
    legalLink: "特定商取引法に基づく表記",
    pillarChronicle: {
      sub: "改ざん耐性のある履歴",
      body:
        "所有と版の連鎖を一つの記録にまとめ、鑑定とエディションを明確に残します。",
    },
    pillarVault: {
      sub: "プライベート保管",
      body:
        "コレクションの所在とアクセスを、役割に応じて最小権限で制御します。",
    },
    pillarPremieres: {
      sub: "公式認定の作品",
      body:
        "作家公式の認定と限定版を提供します。モバイルで鑑賞し、ウェブで手続きと決済を行えます。",
    },
  },
  stats: {
    weekBest: "今週のベスト",
    monthBest: "今月のベスト",
    yearBest: "今年のベスト",
    caption:
      "選定基準は運営ポリシーにより変更される場合があります。",
  },
  archiveGrid: {
    kicker: "Archive preview",
    heading: "From the vault",
    body:
      "作家公式の認定版から、注目エディションを先行表示します。各カードで来歴と版情報を確認できます。",
    viewAll: "すべて表示する",
    artwork: "Artwork",
  },
  marketing: {
    title: "コレクションを、公式の記録とともに。",
    body:
      "アーカイブの閲覧、Vaultの管理、決済はウェブから行えます。鑑賞はアプリで行えます。実物資産の投資商品ではなく、複製不可デジタルアートの体験を提供します。",
    buy: "購入・決済へ進む",
    openVault: "Vaultを開く",
  },
  artworks: {
    kicker: "Archive",
    title: "Artworks",
    body:
      "認定済みデジタルアートの一覧をここから閲覧できます。各作品ページで来歴・エディション情報をご確認ください。",
    back: "← トップへ",
    editionLabel: "Edition:",
    paginationPrev: "前へ",
    paginationNext: "次へ",
    paginationPageOf: "{current} / {total} ページ",
  },
  artistArtworks: {
    title: "Artworks",
    body:
      "登録した作品の一覧です。サムネイルは、本人が所有する作品のみサーバーから提供されます。",
    empty:
      "表示する登録作品がありません。登録が完了しているか、以下の作家IDが正しいかご確認ください。",
    devHint:
      "開発用：URLに ?artist=作家ID を付けると、そのIDで登録された作品を読み込みます（作品登録フォームの Actor userId など）。",
    backVault: "← Vaultへ",
    backHome: "← トップへ",
  },
  vault: {
    overviewKicker: "Vault",
    overviewTitle: "概要",
    overviewBody:
      "プライベート保管中のコレクション状態、通知、Chronicleの更新履歴を、この画面で確認できます。",
    balance: "残高",
    activeBids: "進行中の入札",
    collectionTitle: "コレクション",
    collectionBody: "保有エディション一覧のプレースホルダです。",
    activityTitle: "アクティビティ",
    activityBody: "入札・決済・Chronicleイベントのプレースホルダです。",
    settingsTitle: "設定",
    settingsBody: "アカウント・通知・セキュリティのプレースホルダです。",
    artistGateTitle: "出品者向けの機能",
    artistGateSubmitBody:
      "作品登録は作家（出品者）アカウントのみが利用できます。一般会員の方はVaultのコレクション・アクティビティ等をご利用ください。本番ではサインイン時の役割に応じて自動的に切り替わります。",
    artistGateMyArtworksBody:
      "登録作品の管理は作家アカウントのみが利用できます。一般会員のVaultには表示されません。",
    artistGateSignupCta: "作家として登録する",
    artistGateBackVault: "← Vault概要へ",
    demoSwitchArtist: "デモ：作家モードに切り替え",
    demoSwitchCollector: "デモ：一般会員モードに切り替え",
  },
  tokushoho: {
    back: "← トップへ",
    h1: "特定商取引法に基づく表記",
    statutory: "特定商取引法に基づく表記",
    intro:
      "以下の項目はテンプレートです。事業者情報を確定し、公開前に必ず更新してください。",
    nftNote:
      "本サービスはNFT技術を用いた複製不可デジタルアートの提供・保有体験を目的としており、実物資産または投資商品としての勧誘を目的とはしません。",
    sections: {
      sellerName: {
        title: "販売事業者名",
        hint: "（正式名称を記載してください）",
      },
      operator: { title: "運営責任者", hint: "（氏名を記載してください）" },
      address: {
        title: "所在地",
        hint:
          "（請求があった場合に遅滞なく開示できる住所を記載してください）",
      },
      phone: {
        title: "電話番号",
        hint:
          "（顧客からの連絡用です。公開に支障がある場合は、請求時に遅滞なく開示できる旨を併記してください）",
      },
      email: { title: "メールアドレス", hint: "（問い合わせ窓口）" },
      extraFees: {
        title: "商品代金以外に必要な費用",
        hint:
          "（消費税、送料、決済手数料、ダウンロード通信料等がある場合は具体的に記載してください）",
      },
      payment: {
        title: "代金の支払時期および方法",
        hint:
          "（クレジットカード決済、請求書払い等、決済サービス名とタイミングを記載してください）",
      },
      delivery: {
        title: "商品の引渡時期",
        hint:
          "（デジタルコンテンツの提供方法・即時/日時、物理商品の場合は発送目安を記載してください）",
      },
      returns: {
        title: "返品・キャンセル・不良品について",
        hint:
          "デジタル商品の性質に応じた特約を、法令に照らして明記してください。",
      },
      env: {
        title: "動作環境",
        hint:
          "（推奨OS・ブラウザ、モバイルアプリの対応バージョン等を記載してください）",
      },
    },
  },
  sellerVerifyConsent: {
    overlayAriaLabel: "セキュア接続を確立しています",
    overlayLine1: "セキュア接続を確立しています…",
    overlayLine2:
      "The Vault — 本人確認のための暗号化セッションを準備しています。",
    kicker: "OPUS · Seller",
    title: "出品者向け本人確認",
    subtitle: "本人確認",
    intro:
      "日本の犯罪収益移転防止法およびサービス運営方針に基づき、出品者の精算に向けた本人確認（eKYC）を実施します。",
    sectionHeading: "必須の同意",
    requiredBadge: "[必須]",
    consentCollection:
      "個人情報の収集・利用への同意（氏名、生年月日、住所、身分証情報）",
    consentSensitive: "固有識別情報の取扱いへの同意（身分証番号等）",
    consentThirdParty:
      "第三者提供への同意（本人確認の専門事業者：Stripe Identity、Liquid eKYC 等）",
    dbNote:
      "OPUSのデータベースには身分証画像のパスやカード番号は保存せず、検証結果の参照のみを連携します。",
    back: "戻る",
    next: "本人確認を開始する",
    footerPrivacyMd: "Privacy (MD)",
    footerPrivacy: "プライバシーポリシー",
    footerVault: "Vault",
    alertConsentFail:
      "同意の記録に失敗しました。しばらくしてから再度お試しください。",
    alertNetwork:
      "ネットワークエラーが発生しました。接続をご確認のうえ、再度お試しください。",
  },
  sellerVerifyStart: {
    title: "本人確認セッション",
    body:
      "この画面は、eKYC事業者との連携前のプレースホルダです。安全なリダイレクトまたは埋め込みフローが、まもなく接続されます。",
    backToConsent: "同意画面へ戻る",
    vaultLink: "Vault",
  },
};
