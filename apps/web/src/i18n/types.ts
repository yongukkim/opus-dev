export type LegalSection = { title: string; hint: string };
type SignupMessages = {
  title: string;
  subtitle: string;
  roleLabel: string;
  roleCollector: string;
  roleArtist: string;
  displayNameLabel: string;
  emailLabel: string;
  passwordLabel: string;
  passwordConfirmLabel: string;
  /** Shown when password and confirmation differ on submit. */
  passwordMismatchAlert: string;
  createAccount: string;
  /** Signup consent line lead (before Terms link); shared middle/end/age use auth.* */
  consentPreamble: string;
  /** After consent, when submit clicked but signup API is not wired. */
  signupNotReadyAlert: string;
  alreadyHaveAccount: string;
  signInLink: string;
  note: string;
};

export type Messages = {
  meta: {
    siteDescription: string;
    ogDescription: string;
    tokushohoTitle: string;
    tokushohoDescription: string;
    privacyTitle: string;
    privacyDescription: string;
    termsTitle: string;
    termsDescription: string;
  };
  a11y: {
    primaryNav: string;
    utilityNav: string;
    language: string;
    vaultNav: string;
    designPhilosophy: string;
    hero: string;
    stats: string;
    cta: string;
    archivePreview: string;
  };
  nav: { archive: string; vault: string; legal: string };
  auth: {
    signIn: string;
    title: string;
    subtitle: string;
    roleLabel: string;
    roleCollector: string;
    roleArtist: string;
    continueWithApple: string;
    continueWithGoogle: string;
    continueWithLine: string;
    /** Short label on SSO rows (e.g. Soon). */
    hintSoon: string;
    /** Login: "By continuing you agree to …" lead (before Terms link). */
    consentPreamble: string;
    /** Between Terms and Privacy links. */
    consentBetween: string;
    /** After Privacy link. */
    consentConclude: string;
    /** Required age attestation label. */
    ageCheckbox: string;
    /** Shown when SSO is clicked without consent / age check. */
    consentRequiredAlert: string;
    /** Shown when SSO is clicked after consent but OAuth is not wired. */
    ssoNotReadyAlert: string;
    note: string;
  };
  signup: SignupMessages;
  artistSignup: SignupMessages;
  trust: { line: string; tokushoho: string; chronicle: string; vaultShort: string };
  footer: {
    about: string;
    design: string;
    archive: string;
    vault: string;
    legal: string;
    privacy: string;
    terms: string;
    /** Technical integrity line (Chronicle); KO/JA/EN per locale. */
    chronicleTrust: string;
  };
  legalPrivacy: { back: string; title: string; lead: string; body: string };
  legalTerms: { back: string; title: string; lead: string; body: string };
  vaultNav: {
    overview: string;
    collection: string;
    activity: string;
    submit: string;
    myArtworks: string;
    payouts: string;
    artistProfile: string;
    settings: string;
  };
  hero: {
    kicker: string;
    line1: string;
    line2: string;
    exploreArchive: string;
    viewPremieres: string;
  };
  design: { title: string; body: string; note: string };
  home: {
    kicker: string;
    title: string;
    lead: string;
    buyCta: string;
    legalLink: string;
    pillarChronicle: { sub: string; body: string };
    pillarVault: { sub: string; body: string };
    pillarPremieres: { sub: string; body: string };
  };
  stats: {
    weekBest: string;
    monthBest: string;
    yearBest: string;
    caption: string;
  };
  archiveGrid: {
    kicker: string;
    heading: string;
    body: string;
    viewAll: string;
    artwork: string;
  };
  marketing: { title: string; body: string; buy: string; openVault: string };
  artworks: {
    kicker: string;
    title: string;
    body: string;
    back: string;
    /** Shown before edition fraction, e.g. "Edition: 4/50". */
    editionLabel: string;
    buyCta: string;
    buyHint: string;
    paginationPrev: string;
    paginationNext: string;
    /** Placeholders: `{current}`, `{total}`. */
    paginationPageOf: string;
  };
  checkout: {
    title: string;
    subtitle: string;
    summaryLabel: string;
    summaryArtwork: string;
    summaryFallback: string;
    payCta: string;
    note: string;
    back: string;
  };
  purchaseSuccess: {
    kicker: string;
    title: string;
    subtitle: string;
    body: string;
    bodyWithArtwork: string;
    toVault: string;
    backToArchive: string;
  };
  artistKyc: {
    consentTitle: string;
    consentSubtitle: string;
    consentHeading: string;
    consentBody: string;
    consentCheckbox: string;
    consentNote: string;
    startCta: string;
    startTitle: string;
    startSubtitle: string;
    startHeading: string;
    startBody: string;
    startCompleteDemo: string;
    startPending: string;
    startNote: string;
    startNotReadyAlert: string;
    backToVault: string;
  };
  payouts: {
    title: string;
    subtitle: string;
    heading: string;
    body: string;
    bankNameLabel: string;
    bankNamePlaceholder: string;
    accountHolderLabel: string;
    accountHolderPlaceholder: string;
    accountNumberLabel: string;
    accountNumberPlaceholder: string;
    accountNumberHint: string;
    saveCta: string;
    savedBanner: string;
    note: string;
  };
  artistProfile: {
    title: string;
    subtitle: string;
    heading: string;
    body: string;
    displayNameLabel: string;
    displayNamePlaceholder: string;
    bioLabel: string;
    bioPlaceholder: string;
    saveCta: string;
    savedBanner: string;
    note: string;
  };
  submitSuccess: {
    kicker: string;
    title: string;
    body: string;
    toMyArtworks: string;
    toVault: string;
  };
  accountSettings: {
    title: string;
    subtitle: string;
    authGateTitle: string;
    authGateBody: string;
    profileHeading: string;
    profileBody: string;
    displayNameLabel: string;
    displayNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    saveProfileCta: string;
    passwordHeading: string;
    passwordBody: string;
    currentPasswordLabel: string;
    newPasswordLabel: string;
    confirmPasswordLabel: string;
    passwordMismatchAlert: string;
    changePasswordCta: string;
    savedBanner: string;
    linksHeading: string;
    toPayouts: string;
    toArtistProfile: string;
    note: string;
  };
  /** Artist-only grid (mirrors public artworks layout; kicker = artist display name). */
  artistArtworks: {
    title: string;
    body: string;
    empty: string;
    devHint: string;
    backVault: string;
    backHome: string;
  };
  submitArtwork: {
    kicker: string;
    title: string;
    subtitle: string;
    artistNameLabel: string;
    /** Pen name on artwork form (KO: 필명, JA: 筆名). */
    nicknameLabel: string;
    artworkTitleLabel: string;
    genreLabel: string;
    genrePlaceholder: string;
    yearLabel: string;
    descriptionLabel: string;
    tagsLabel: string;
    tagsHint: string;
    editionModeLabel: string;
    editionModeUnique: string;
    editionModeLimited: string;
    editionTotalLabel: string;
    editionTotalHint: string;
    initialMintLabel: string;
    initialMintHint: string;
    numberingPolicyLabel: string;
    numberingPolicyAuto: string;
    numberingPolicyManual: string;
    lockEditionLabel: string;
    lockEditionHint: string;
    rightsConfirmLabel: string;
    rightsConfirmHint: string;
    uploadLabel: string;
    uploadHint: string;
    apiSaveOk: string;
    apiSaveErr: string;
    saveDraft: string;
    submit: string;
    previewTitle: string;
  };
  vault: {
    overviewKicker: string;
    overviewTitle: string;
    overviewBody: string;
    balance: string;
    activeBids: string;
    collectionTitle: string;
    collectionBody: string;
    activityTitle: string;
    activityBody: string;
    settingsTitle: string;
    settingsBody: string;
    /** Collector (일반 회원)가 작가 전용 경로를 열었을 때 */
    artistGateTitle: string;
    artistGateSubmitBody: string;
    artistGateMyArtworksBody: string;
    artistGatePayoutsBody: string;
    artistGateProfileBody: string;
    artistGateSignupCta: string;
    artistGateBackVault: string;
    artistKycGateBody: string;
    artistKycGateCta: string;
    /** Until SSO: switch UI role for local demo */
    demoSwitchArtist: string;
    demoSwitchCollector: string;
  };
  tokushoho: {
    back: string;
    h1: string;
    statutory: string;
    intro: string;
    nftNote: string;
    sections: {
      sellerName: LegalSection;
      operator: LegalSection;
      address: LegalSection;
      phone: LegalSection;
      email: LegalSection;
      extraFees: LegalSection;
      payment: LegalSection;
      delivery: LegalSection;
      returns: LegalSection;
      env: LegalSection;
    };
  };
  /** Seller eKYC consent (one UI language per locale; no KO/JA mix on one screen). */
  sellerVerifyConsent: {
    overlayAriaLabel: string;
    overlayLine1: string;
    overlayLine2: string;
    kicker: string;
    title: string;
    subtitle: string;
    intro: string;
    sectionHeading: string;
    requiredBadge: string;
    consentCollection: string;
    consentSensitive: string;
    consentThirdParty: string;
    dbNote: string;
    back: string;
    next: string;
    footerPrivacyMd: string;
    footerPrivacy: string;
    footerVault: string;
    alertConsentFail: string;
    alertNetwork: string;
  };
  sellerVerifyStart: {
    title: string;
    body: string;
    backToConsent: string;
    vaultLink: string;
  };
};
