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
  };
  nav: { releases: string; vault: string; legal: string; provenance: string };
  /**
   * Channel badges shown on home rails and (later) the ⌘K omni-search results.
   * Always exactly one of `primary` (新作 / Releases) or `secondary` (来歴 /
   * Provenance) — never both. PR-4 introduces `secondary`; PR-5 will add
   * `primary` when Rail A swaps to per-artwork links with the New release pill.
   * See spec §3.3, §3.4 and §6.
   */
  badge: {
    /** PRIMARY channel marker — 新作 / 新作 / New release. */
    primary: string;
    /** SECONDARY channel marker — 来歴 / 来歴 / Provenance. */
    secondary: string;
  };
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
    /** Shown on the active Google row (opposite of Soon). */
    hintActive: string;
    /** Login: "By continuing you agree to …" lead (before Terms link). */
    consentPreamble: string;
    /** Between Terms and Privacy links. */
    consentBetween: string;
    /** After Privacy link. */
    consentConclude: string;
    /**
     * Checkbox: agree to Terms + Privacy (inline links).
     *
     * Cross-border transfer disclosure (Google LLC / United States) is kept OUT
     * of the checkbox label itself to match common JP market practice (e.g.
     * Mercari, note, Rakuten), and is instead disclosed in full inside the
     * Privacy Policy that this checkbox consents to. This satisfies both
     * APPI §28 (name + jurisdiction + safeguards in the consented-to policy)
     * and PIPA §28-8 ②항 (all 6 statutory notification elements listed in the
     * policy). See `apps/web/public/docs/privacy-policy.{ko,ja,en}.md` §6.
     *
     * When additional OAuth providers are activated whose data leaves Japan
     * (e.g. Apple Inc. — US), the Privacy Policy §6 must be extended BEFORE
     * enabling the provider. No label change is required if §6 is complete.
     */
    consentTermsPrivacyLead: string;
    consentTermsPrivacyMid: string;
    consentTermsPrivacyEnd: string;
    /** Optional marketing opt-in. */
    consentMarketingCheckbox: string;
    /** Required age attestation label. */
    ageCheckbox: string;
    /** Shown when required consent checkboxes are incomplete. */
    consentRequiredAlert: string;
    /** Server-side consent cookie failed. */
    consentPrecheckFailedAlert: string;
    /** OAuth client env missing. */
    googleNotConfiguredAlert: string;
    signOut: string;
    /** Shown when SSO is clicked after consent but OAuth is not wired. */
    ssoNotReadyAlert: string;
    /** Divider between SNS and email on unified auth page. */
    emailDividerLabel: string;
    emailLabel: string;
    passwordLabel: string;
    note: string;
  };
  signup: SignupMessages;
  artistSignup: SignupMessages;
  trust: { line: string; tokushoho: string; chronicle: string; vaultShort: string };
  footer: {
    about: string;
    design: string;
    releases: string;
    provenance: string;
    vault: string;
    legal: string;
    privacy: string;
    terms: string;
    /** Technical integrity line (Chronicle); KO/JA/EN per locale. */
    chronicleTrust: string;
    appRequiredTitle: string;
    appRequiredBody: string;
    appRequiredIos: string;
    appRequiredAndroid: string;
    appRequiredComingSoon: string;
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
    /** Vault: register a collector-to-collector transfer offer (demo). */
    transferRegister: string;
  };
  hero: {
    kicker: string;
    line1: string;
    line2: string;
    /** Primary CTA — primary market: artist's first public release (`/releases`). */
    openReleases: string;
    /** Secondary CTA — previous custodian seeks the next custodian (`/provenance`). */
    openProvenance: string;
    /**
     * Small helper line under the CTAs hinting at the ⌘K omni-search modal.
     * The modal itself is introduced in a later PR; this PR only displays the hint.
     */
    searchHint: string;
  };
  design: { title: string; body: string; note: string };
  home: {
    kicker: string;
    title: string;
    lead: string;
    buyCta: string;
    legalLink: string;
    appRequiredTitle: string;
    appRequiredBody: string;
    appRequiredIos: string;
    appRequiredAndroid: string;
    appRequiredComingSoon: string;
    /** Shared "Coming soon" badge used on rail / chronicle placeholders below. */
    comingSoon: string;
    /**
     * Curation rail copy introduced in PR-3 (home IA rebuild) and progressively
     * filled in by PR-4..PR-7. Rails that already have their data wired add the
     * extra header / empty-state strings they need; placeholder rails keep just
     * `title` + `body` until their data PR lands.
     */
    railReleases: {
      title: string;
      body: string;
      /** Header link → /releases full list. */
      viewAll: string;
    };
    railProvenance: {
      title: string;
      body: string;
      /** Header link → /provenance full list. Wired in PR-4. */
      viewAll: string;
      /** Empty state when there are no open custody transfers. */
      empty: string;
      /** Empty-state CTA → /vault/transfer/register. */
      registerCta: string;
    };
    railFeaturedArtists: { title: string; body: string };
    railCuration: { title: string; body: string };
    /** The Chronicle preview placeholder (PR-9 will swap in real masked entries). */
    chroniclePreview: { title: string; body: string };
  };
  stats: {
    weekBest: string;
    monthBest: string;
    yearBest: string;
    caption: string;
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
    /** Grid vs list layout toggle (Archive / The Chronicle catalog). */
    viewGridLabel: string;
    viewListLabel: string;
    viewToggleAria: string;
    paginationPrev: string;
    paginationNext: string;
    /** Placeholders: `{current}`, `{total}`. */
    paginationPageOf: string;
    /** Catalog work detail (purchase flow). */
    detailListPrice: string;
    detailDemoNote: string;
    detailBuyCta: string;
    detailAppRequiredTitle: string;
    detailAppRequiredBody: string;
    detailAppRequiredIos: string;
    detailAppRequiredAndroid: string;
    detailAppRequiredComingSoon: string;
    /** CTA on grid/list to open the work detail page. */
    openWorkCta: string;
    detailBackArchive: string;
    /** Product-style detail (The Chronicle item page). */
    detailBreadcrumbHome: string;
    detailBreadcrumbArchive: string;
    detailArtistLabel: string;
    detailPriceTaxNote: string;
    detailStockNote: string;
    detailSpecArtist: string;
    detailSpecEdition: string;
    detailSpecFormat: string;
    detailSpecAudienceTone: string;
    audienceToneMale: string;
    audienceToneFemale: string;
    audienceToneNone: string;
    detailFormatValue: string;
    detailAboutHeading: string;
    detailAboutBody: string;
    detailAddToCart: string;
    detailAddToWishlist: string;
    detailAddedToCart: string;
    detailAddedToWishlist: string;
    detailCollectDemoNote: string;
    detailPrecautionsHeading: string;
    detailPrecautionBullets: readonly string[];
    detailRelatedHeading: string;
    detailRelatedLead: string;
    detailSameArtistHeading: string;
    detailSameArtistLead: string;
    detailSameArtistEmpty: string;
    detailMoreInArchive: string;
  };
  checkout: {
    title: string;
    subtitle: string;
    summaryLabel: string;
    summaryArtwork: string;
    summaryFallback: string;
    /** Placeholder `{price}` — e.g. formatted JPY. */
    summaryPrice: string;
    payCta: string;
    note: string;
    appRequiredTitle: string;
    appRequiredBody: string;
    appRequiredIos: string;
    appRequiredAndroid: string;
    appRequiredComingSoon: string;
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
    audienceLabel: string;
    audienceMale: string;
    audienceFemale: string;
    audienceNone: string;
    audienceHint: string;
    yearLabel: string;
    /** Sale list price in JPY (integer). */
    priceLabel: string;
    priceHint: string;
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
  /** Collector-to-collector edition handoff (no financial-product framing in UI copy). */
  collectorTransfer: {
    registerKicker: string;
    registerTitle: string;
    registerSubtitle: string;
    sectionArtist: string;
    sectionWork: string;
    sectionOffer: string;
    userIdDevLabel: string;
    userIdDevHint: string;
    artistLegalNameLabel: string;
    artistLegalNameHint: string;
    artistPenNameLabel: string;
    artistPenNameHint: string;
    artworkTitleLabel: string;
    genreLabel: string;
    genrePlaceholder: string;
    genreOptDigitalPainting: string;
    genreOptIllustration: string;
    genreOptPhotography: string;
    genreOpt3d: string;
    genreOptGenerative: string;
    genreOptVideo: string;
    genreOptMixedMedia: string;
    genreOptOther: string;
    yearLabel: string;
    yearHint: string;
    descriptionLabel: string;
    tagsLabel: string;
    tagsHint: string;
    editionRefLabel: string;
    editionRefHint: string;
    priceLabel: string;
    priceHint: string;
    noteLabel: string;
    noteHint: string;
    rightsConfirmLabel: string;
    rightsConfirmHint: string;
    saveDraft: string;
    submitCta: string;
    successBanner: string;
    errorBanner: string;
    consentRequiredAlert: string;
    previewTitle: string;
    previewPublicOnly: string;
    previewLegalHidden: string;
    previewFooter: string;
    /** Shown only in development: link to open this flow without demo session. */
    devPreviewLink: string;
    /** Banner when viewing register page with ?preview=1 in development. */
    devPreviewBanner: string;
    listingsTitle: string;
    listingsSubtitle: string;
    listingsEmpty: string;
    listingsArtistPublic: string;
    listingsGenre: string;
    listingsYear: string;
    listingsSellerRef: string;
    listingsPrice: string;
    listingsListedAt: string;
    listingsDemoNote: string;
    listingsBackHome: string;
    listingsRegisterCta: string;
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
  operatorReview: {
    title: string;
    subtitle: string;
    note: string;
    filterLabel: string;
    filterPending: string;
    filterApproved: string;
    filterChanges: string;
    filterRejected: string;
    filterAll: string;
    colArtwork: string;
    colArtist: string;
    colStatus: string;
    colRating: string;
    colActions: string;
    approve: string;
    approveMature: string;
    rejectExplicit: string;
    bootstrapHeading: string;
    bootstrapBody: string;
    bootstrapCta: string;
    bootstrapPending: string;
    alertFail: string;
  };
};
