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
    copyrightTitle: string;
    copyrightDescription: string;
    /** PR-16: public-route metadata. Titles are appended with ` | OPUS`
     *  by the root `title.template`, so these are the leading phrase. */
    curationIndexTitle: string;
    curationIndexDescription: string;
    featuredArtistsTitle: string;
    featuredArtistsDescription: string;
    /** Templated — uses `{name}` token (artist pen name). */
    artistTitleTpl: string;
    artistDescriptionTpl: string;
    /** PR-19: fills the metadata gap PR-16 left for `/releases` +
     *  `/provenance` index. Static strings (no token) — the index
     *  pages don't depend on a per-slug resolve. */
    releasesIndexTitle: string;
    releasesIndexDescription: string;
    provenanceIndexTitle: string;
    provenanceIndexDescription: string;
    /** `/provenance?saleMode=auction` index `<title>` / OG. */
    provenanceAuctionIndexTitle: string;
    provenanceAuctionIndexDescription: string;
    /** PR-19: `/releases/[slug]` detail. Templated with `{title}`
     *  (artwork title) and `{artist}` (pen name). Falls back to the
     *  releases index copy when the slug doesn't resolve, same
     *  pattern PR-16 uses for `/artist/[slug]`. */
    releaseTitleTpl: string;
    releaseDescriptionTpl: string;
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
  nav: {
    releases: string;
    vault: string;
    legal: string;
    provenance: string;
    /** Primary nav — custody transfers listed in auction mode (`/provenance?saleMode=auction`). */
    provenanceAuctions: string;
    /** Operator-curated shelves index (PR-11). Single word per locale. */
    curation: string;
    /** Featured artists index (PR-12). Single word per locale. */
    artists: string;
  };
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
  /**
   * ⌘K omni-search MVP. PR-8 of the home redesign series — see spec §4
   * (`docs/home-redesign-curation-rails-and-omnisearch.md`). The MVP renders
   * a `cmdk` modal that fetches a build-time index and matches client-side.
   * All identifiers in the index are pen names / masked seller ids only
   * (ISO 27001 A.18.1.4, .cursorrules §2 vocabulary guard).
   */
  search: {
    /** Header trigger button label, also acts as aria-label. */
    triggerLabel: string;
    /**
     * Short visible label on search chips (e.g. KO「검색」) — not keyboard
     * symbols like ⌘K; those remain available via keybindings in code only.
     */
    triggerChip: string;
    /** Modal title (visually hidden, used for aria-labelledby). */
    modalTitle: string;
    /** Input placeholder. */
    placeholder: string;
    /** Aria-label for the scope tab list. */
    scopeAria: string;
    scopeAll: string;
    scopeArtwork: string;
    scopeArtist: string;
    scopeListing: string;
    /** PR-14: operator-curated shelves scope. */
    scopeShelf: string;
    /** Result group headers. */
    groupArtworks: string;
    groupArtists: string;
    groupListings: string;
    /** PR-14: shelf group header. */
    groupShelves: string;
    /** Per-row meta strings. `worksCount` uses `{n}` token. */
    worksCount: string;
    /** PR-14: shelf row meta — total items on the shelf; uses `{n}`. */
    itemsCount: string;
    /** Empty state when query has no matches. */
    empty: string;
    /** Empty state CTAs (links into Releases / Provenance). */
    viewAllReleases: string;
    viewAllProvenance: string;
    /**
     * Home §3.2 — fake "search field" on the first screen (between Hero and
     * `<main>`). Opens the same modal as ⌘K / the header trigger.
     * Visible prompt; `hintCardAriaLabel` is the full control label for SRs.
     */
    hintCardPrompt: string;
    hintCardAriaLabel: string;
    /** While index.json is being fetched. */
    loading: string;
    /** Footer hint chips. `results` uses `{n}` token. */
    hintSelect: string;
    hintMove: string;
    hintClose: string;
    results: string;
    /** Shown on provenance listing hits in ⌘K when `saleMode` is auction. */
    listingAuctionPill: string;
  };
  /**
   * `/[locale]/featured-artists` index — PR-12 of the home redesign series,
   * follow-up to PR-10. Lists every eligible artist (the same selection
   * rule the home Rail C uses: ≥ 2 catalog works OR an operator pick) on
   * a dedicated surface. Each card links into the existing
   * `/[locale]/artist/[slug]` PDP-like page from PR-10. All copy here
   * stays pen-name-shaped (ISO 27001 A.18.1.4) and avoids investment /
   * yield vocabulary (.cursorrules §2).
   */
  featuredArtists: {
    /** Tiny eyebrow above the index heading. */
    kicker: string;
    /** Breadcrumb labels. */
    breadcrumbHome: string;
    breadcrumbIndex: string;
    /** Index page heading + sublead. */
    indexHeading: string;
    indexLead: string;
    /** Index empty state when no artist passes the selection rule. */
    indexEmpty: string;
    /** Per-card meta — uses `{n}` token. */
    worksCount: string;
    /** Per-card CTA → /artist/<slug>. */
    viewProfile: string;
    /** Tiny chip on cards that are operator-picked (visual cue only). */
    operatorPickBadge: string;
  };
  /**
   * `/[locale]/curation` (index) and `/[locale]/curation/[id]` (detail)
   * pages — PR-11 of the home redesign series, follow-up to PR-7. The
   * `/curation` index lists every operator-curated shelf and the detail
   * page expands a single shelf to its full work grid. All copy here is
   * UI chrome only; shelf titles + descriptions remain in `data/curation.ts`
   * (operator-authored, vocabulary-guarded by `.cursorrules`).
   */
  curation: {
    /** Tiny eyebrow above the index heading. */
    kicker: string;
    /** Breadcrumb labels reused by both pages. */
    breadcrumbHome: string;
    breadcrumbIndex: string;
    /** Index page heading + sublead. */
    indexHeading: string;
    indexLead: string;
    /** Index empty state (no shelves at all in the catalog). */
    indexEmpty: string;
    /** CTA on each shelf card → /curation/<id>. */
    viewShelf: string;
    /** Per-card meta — uses `{n}` token. */
    itemsCount: string;
    /** Detail page works heading + sublead. */
    worksHeading: string;
    worksLead: string;
    /** Detail empty state (every item dropped from this shelf). */
    detailEmpty: string;
    /** Footer return link on the detail page. */
    backToIndex: string;
    /** Not-found page copy. */
    notFoundTitle: string;
    notFoundBody: string;
    notFoundCta: string;
  };
  /**
   * `/[locale]/artist/[slug]` page (PR-10 of the home redesign series —
   * follow-up to PR-6 / PR-8). The page surfaces an artist's pen name +
   * works grid; before this PR, Rail C and the omni-search artist rows
   * temporarily linked into the first work's PDP. All copy here must
   * stay pen-name-shaped (ISO 27001 A.18.1.4) and avoid investment /
   * yield vocabulary (.cursorrules §2).
   */
  artist: {
    /** Tiny eyebrow above the heading. */
    kicker: string;
    /** Breadcrumb labels. */
    breadcrumbHome: string;
    breadcrumbReleases: string;
    /** Works section heading + sublead. */
    worksHeading: string;
    worksLead: string;
    /** Per-card meta — uses `{n}` token. */
    worksCount: string;
    /** Empty-state when an operator pick has no resolvable files. */
    empty: string;
    /** Footer return links. */
    backToReleases: string;
    /** Not-found page copy. */
    notFoundTitle: string;
    notFoundBody: string;
    notFoundCta: string;
    /**
     * PR-15: "Shelves this artist appears on" section. Only rendered when
     * the artist has at least one resolved shelf, so empty-state copy is
     * deliberately absent (the entire section hides instead).
     */
    shelves: {
      heading: string;
      lead: string;
      /** Per-card chip — uses `{n}` token for the shelf's total item count. */
      itemsCount: string;
      /** Per-card CTA → `/curation/<id>`. */
      viewShelf: string;
    };
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
    /** Footer link to copyright & permitted-use notice for listed editions. */
    copyright: string;
    /** Technical integrity line (Chronicle); KO/JA/EN per locale. */
    chronicleTrust: string;
    appRequiredTitle: string;
    appRequiredBody: string;
    appRequiredIos: string;
    appRequiredAndroid: string;
    appRequiredComingSoon: string;
    /** Strapline under the enclosure mark in the site footer. */
    securedByLine: string;
  };
  legalPrivacy: { back: string; title: string; lead: string; body: string };
  legalTerms: { back: string; title: string; lead: string; body: string };
  legalCopyright: { back: string; title: string; lead: string; body: string };
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
    /** Operator-only authority settings. */
    authoritySettings: string;
  };
  vaultAuthority: {
    title: string;
    subtitle: string;
    reviewSection: string;
    accountSection: string;
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
      /** Home rail when no approved artist submissions are published yet. */
      empty: string;
    };
    railProvenance: {
      title: string;
      body: string;
      /** Header link → /provenance?saleMode=auction (auction-mode listings only). */
      viewAuctions: string;
      /** Header link → /provenance full list. Wired in PR-4. */
      viewAll: string;
      /** Empty state when there are no open custody transfers. */
      empty: string;
      /** Empty-state CTA → /vault/collection (pick a held work, then transfer). */
      registerCta: string;
    };
    railFeaturedArtists: {
      title: string;
      body: string;
      /** CTA on each artist card → that artist's work (PR-6 links to first PDP). */
      viewWorks: string;
      /** Works-count chip; uses `{n}` token (e.g. "{n} works"). */
      worksCount: string;
      /** Shown when neither grouping nor static picks yield any artists. */
      empty: string;
      /**
       * Header CTA → /featured-artists index page (PR-12). Mirrors the
       * `viewAll` field on the other rails so the home IA stays uniform.
       */
      viewAll: string;
    };
    railCuration: {
      title: string;
      body: string;
      /** Header CTA → /curation index page (lands in a follow-up PR). */
      viewAll: string;
      /** Shown when the static catalog is empty. */
      empty: string;
    };
    /** The Chronicle preview placeholder (PR-9 will swap in real masked entries). */
    chroniclePreview: {
      title: string;
      body: string;
      /** Event-type chip labels — visual commitment to phase-2 vocabulary. */
      eventPrimary: string;
      eventSecondary: string;
      eventVaultNote: string;
      /** Legend explaining the masking format for from/to identifiers. */
      maskLegend: string;
    };
  };
  stats: {
    weekBest: string;
    monthBest: string;
    yearBest: string;
    caption: string;
    /** Shown when there are no picks images (no approved submissions and insufficient local catalog). */
    empty: string;
  };
  marketing: {
    title: string;
    body: string;
    buy: string;
    openVault: string;
    /** Spec §3.8 — secondary channel; links to `/provenance` (1차 Buy remains primary CTA). */
    openProvenance: string;
  };
  artworks: {
    kicker: string;
    title: string;
    body: string;
    /** Shown on /releases when there are no approved artist submissions (no demo catalog). */
    releasesEmpty: string;
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
    artistNameAutoHint: string;
    artistNameVisibilityLabel: string;
    artistNameVisibilityPublic: string;
    artistNameVisibilityPrivate: string;
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
    collectionEmpty: string;
    /** CTA → `/vault/transfer/register?submissionId=` */
    collectionTransferCta: string;
    collectionViewDetail: string;
    /** Shown when work is not operator-approved yet (no transfer form link). */
    collectionNotApprovedHint: string;
    collectionStatusApproved: string;
    collectionStatusPending: string;
    collectionStatusOther: string;
    /** Chip when Chronicle owner role is artist (studio inventory). */
    collectionHeldBadgeArtist: string;
    /** Chip when Chronicle owner role is collector. */
    collectionHeldBadgeCollector: string;
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
    /** Collector must open this page with `?submissionId=` of an owned approved work. */
    transferRegisterMissingSubmission: string;
    transferRegisterMissingSubmissionHint: string;
    transferRegisterInvalidSubmission: string;
    /** Shown above read-only artist/work fields when bound to a submission. */
    transferRegisterWorkLockedHint: string;
    /** Placeholder when artist legal name was private on the original registration. */
    artistLegalNameRedactedHint: string;
    transferRegisterApiSubmissionRequired: string;
    transferRegisterApiForbiddenSubmission: string;
    sectionArtist: string;
    sectionWork: string;
    sectionOffer: string;
    /** How the holder lists the edition: fixed amount vs auction (opening bid stored as JPY). */
    sectionSaleMode: string;
    saleModeFixedLabel: string;
    saleModeFixedDescription: string;
    saleModeAuctionLabel: string;
    saleModeAuctionDescription: string;
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
    priceLabelFixed: string;
    priceHintFixed: string;
    priceLabelAuction: string;
    priceHintAuction: string;
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
    /** Shown when `?saleMode=auction` is active but there are no open auction-mode listings. */
    listingsEmptyAuctionFilter: string;
    /** Shown under the index title when viewing `/provenance?saleMode=auction`. */
    listingsAuctionFilterHint: string;
    listingsArtistPublic: string;
    listingsGenre: string;
    listingsYear: string;
    listingsSellerRef: string;
    listingsPrice: string;
    /** Short chip on index/detail when saleMode is fixed. */
    listingsSaleModeFixed: string;
    /** Short chip when saleMode is auction. */
    listingsSaleModeAuction: string;
    listingsListedAt: string;
    listingsDemoNote: string;
    listingsBackHome: string;
    listingsRegisterCta: string;
    /**
     * PR-18: `/provenance/[id]` detail page. Reuses the `listings*`
     * labels above for field captions (artist, price, seller, etc.);
     * these keys only cover the chrome (eyebrow / breadcrumbs /
     * section headings / detail-only CTAs / 404 copy / metadata).
     */
    listingsDetailKicker: string;
    listingsDetailBreadcrumbHome: string;
    listingsDetailDescriptionHeading: string;
    listingsDetailNotesHeading: string;
    listingsDetailTagsHeading: string;
    listingsDetailBackToIndex: string;
    listingsDetailNotFoundTitle: string;
    listingsDetailNotFoundBody: string;
    listingsDetailNotFoundCta: string;
    /** Uses `{title}` token. Root template appends ` | OPUS`. */
    listingsDetailMetaTitleTpl: string;
    listingsDetailMetaDescriptionTpl: string;
    /**
     * PR-20: aria-label for the `/artist/[slug]` cross-link on the
     * provenance detail page. Rendered only when the listing's pen
     * name resolves via `findArtistByPenName`. Uses `{name}` token.
     */
    listingsDetailViewArtistAria: string;
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
  operatorAdmin: {
    title: string;
    subtitle: string;
    unauthorizedTitle: string;
    unauthorizedBody: string;
    searchLabel: string;
    searchPlaceholder: string;
    empty: string;
    colName: string;
    colEmail: string;
    colRole: string;
    colCreated: string;
    colActions: string;
    roleCollector: string;
    roleArtist: string;
    roleOperator: string;
    updateSuccess: string;
    updateFail: string;
    selfGuard: string;
  };
};
