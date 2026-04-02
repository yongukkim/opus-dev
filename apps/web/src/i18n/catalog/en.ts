import type { Messages } from "../types";

export const en: Messages = {
  meta: {
    siteDescription:
      "OPUS — authenticated non-fungible digital art editions and The Chronicle. Crafted for collecting and appreciation, not investment positioning.",
    ogDescription:
      "Premium digital art archive — near-black charcoal, champagne brass, provenance and the vault. Not an investment product.",
    tokushohoTitle: "Specified commercial disclosures",
    tokushohoDescription:
      "Draft disclosures under Japan’s Specified Commercial Transaction Act. Update after legal and tax review.",
    privacyTitle: "Privacy policy",
    privacyDescription:
      "Draft OPUS privacy policy. Update after legal review and Japan APPI alignment.",
    termsTitle: "Terms of use",
    termsDescription:
      "Draft OPUS terms of use. Update after legal sign-off.",
  },
  a11y: {
    primaryNav: "Primary",
    utilityNav: "Utility",
    language: "Language",
    vaultNav: "Vault navigation",
    designPhilosophy: "Design philosophy",
    hero: "OPUS hero",
    stats: "Trust metrics",
    cta: "Call to action",
    archivePreview: "Archive preview",
  },
  nav: { archive: "Archive", vault: "Vault", legal: "Legal" },
  auth: {
    signIn: "Sign in",
    title: "Sign in",
    subtitle: "Collectors can start with Apple, Google, or LINE.",
    roleLabel: "Account type",
    roleCollector: "Collector",
    roleArtist: "Artist",
    continueWithApple: "Continue with Apple",
    continueWithGoogle: "Continue with Google",
    continueWithLine: "Continue with LINE",
    hintSoon: "Soon",
    consentPreamble: "By continuing you agree to the ",
    consentBetween: " and the ",
    consentConclude: ".",
    ageCheckbox: "I am 18 years of age or older.",
    consentRequiredAlert:
      "Please confirm you are 18 or older and agree to the Terms of Use and Privacy Policy.",
    ssoNotReadyAlert: "Single sign-on is not connected yet. This will be available soon.",
    note: "UI only for now. OAuth wiring comes next.",
  },
  signup: {
    title: "Sign up",
    subtitle: "Create your OPUS account to continue.",
    roleLabel: "Account type",
    roleCollector: "Collector",
    roleArtist: "Artist",
    displayNameLabel: "Display name",
    emailLabel: "Email",
    passwordLabel: "Password",
    passwordConfirmLabel: "Confirm password",
    passwordMismatchAlert: "Password and confirmation do not match.",
    createAccount: "Create account",
    consentPreamble: "By proceeding you agree to the ",
    signupNotReadyAlert: "Sign-up is not available yet. This will be available soon.",
    alreadyHaveAccount: "Already have an account?",
    signInLink: "Sign in",
    note: "UI only for now. Account integration comes next.",
  },
  artistSignup: {
    title: "Artist registration",
    subtitle: "Artist accounts follow a separate registration flow for submissions.",
    roleLabel: "Account type",
    roleCollector: "Collector",
    roleArtist: "Artist",
    displayNameLabel: "Display name",
    emailLabel: "Email",
    passwordLabel: "Password",
    passwordConfirmLabel: "Confirm password",
    passwordMismatchAlert: "Password and confirmation do not match.",
    createAccount: "Create artist account",
    consentPreamble: "By proceeding you agree to the ",
    signupNotReadyAlert: "Artist registration is not available yet. This will be available soon.",
    alreadyHaveAccount: "Already have an account?",
    signInLink: "Sign in",
    note: "UI only for now. Signup and verification come next.",
  },
  trust: {
    line: "Authenticated editions · Provenance · Not an investment product",
    tokushoho: "Commercial disclosures (Japan)",
    chronicle: "The Chronicle",
    vaultShort: "Vault",
  },
  footer: {
    about:
      "The archive of digital masterpieces — authenticated editions, collector provenance, and the vault.",
    design:
      "Design: Classic Luxury — near-black charcoal, champagne brass (gradient-lit metal), warm white type, restrained decoration. Not an investment or physical-asset product.",
    archive: "Archive",
    vault: "Vault",
    legal: "Specified commercial disclosures (Japan)",
    privacy: "Privacy policy",
    terms: "Terms of use",
    chronicleTrust: "Verified by The Chronicle Technology",
  },
  legalPrivacy: {
    back: "← Back home",
    title: "Privacy policy",
    lead: "Draft for Japan market readiness and due diligence (DD). Align with APPI before launch.",
    body:
      "Defines categories of personal data, purposes, retention, subprocessors, cross-border transfers, data subject rights (access, correction, deletion, restriction), contact channels, and security measures. Must match production systems, logs, and encryption practices.",
  },
  legalTerms: {
    back: "← Back home",
    title: "Terms of use",
    lead: "Governs authenticated digital art editions and collector experience — not investment or financial products.",
    body:
      "Covers service scope, roles (artist, collector, operator), copyright and licensing, The Chronicle records, prohibited conduct, limitations of liability, and governing law / dispute resolution. NFT technology is a means to evidence provenance and edition authenticity for non-fungible digital art.",
  },
  vaultNav: {
    overview: "Overview",
    collection: "Collection",
    activity: "Activity",
    submit: "Submit artwork",
    myArtworks: "My artworks",
    settings: "Settings",
  },
  submitArtwork: {
    kicker: "Artist",
    title: "Submit artwork",
    subtitle: "Provide the essentials for artist submission and upload your file.",
    artistNameLabel: "Artist name (legal)",
    nicknameLabel: "Nick name",
    artworkTitleLabel: "Artwork title",
    genreLabel: "Genre",
    genrePlaceholder: "Select a genre",
    yearLabel: "Year",
    descriptionLabel: "Description",
    tagsLabel: "Tags",
    tagsHint: "Comma-separated (e.g., abstract, monochrome, portrait)",
    editionModeLabel: "Edition type",
    editionModeUnique: "Unique (1/1)",
    editionModeLimited: "Limited (multiple editions)",
    editionTotalLabel: "Total editions",
    editionTotalHint: "You can set up to 20 copies.",
    initialMintLabel: "Initial mint quantity",
    initialMintHint: "Quantity to mint at first release. It cannot exceed total editions.",
    numberingPolicyLabel: "Edition numbering policy",
    numberingPolicyAuto: "Auto assign",
    numberingPolicyManual: "Manual assign",
    lockEditionLabel: "Lock total editions",
    lockEditionHint: "Restrict changes to total editions after submission.",
    rightsConfirmLabel: "Rights confirmation",
    rightsConfirmHint: "I confirm I own the rights or have permission to upload this work.",
    uploadLabel: "File upload",
    uploadHint: "Image (JPG/PNG/WEBP) or video (MP4/WEBM). Up to 10MB.",
    apiSaveOk: "Saved. You can view it in the Archive.",
    apiSaveErr: "Save failed. Please check your inputs and file.",
    saveDraft: "Save draft",
    submit: "Submit",
    previewTitle: "Preview",
  },
  hero: {
    kicker: "Authenticated non-fungible digital art editions",
    line1:
      "Not a copy — your own “digital original.” Artist-official authentication flows into a private Vault.",
    line2:
      "The archive of digital masterpieces — authenticity, edition, and collector provenance in one chain of record.",
    exploreArchive: "Explore the Archive",
    viewPremieres: "View premieres",
  },
  design: {
    title: "Classic Luxury",
    body:
      "A near-black charcoal field with desaturated champagne brass accents. Metallic surfaces use layered gradients and subtle highlight and shade — not flat gold, neon, or plastic gloss.",
    note:
      "This service focuses on collectible, non-fungible digital art experiences — not physical-asset or investment positioning.",
  },
  home: {
    kicker: "OPUS",
    title: "A place for photography and collecting",
    lead: "Payments and guidance on this site. Viewing works in the mobile app.",
    buyCta: "Purchase & pay",
    legalLink: "Commercial disclosures (Japan)",
    pillarChronicle: {
      sub: "Tamper-resistant record",
      body: "Chain ownership and editions in one record. Keep appraisal and edition facts clear.",
    },
    pillarVault: {
      sub: "Private custody",
      body: "Control where collections live and who accesses them — least privilege by role.",
    },
    pillarPremieres: {
      sub: "Officially certified works",
      body: "Artist-official certification and limited editions. View on mobile; steps and payment on the web.",
    },
  },
  stats: {
    weekBest: "Best this week",
    monthBest: "Best this month",
    yearBest: "Best of the year",
    caption: "Selection criteria may change per editorial policy.",
  },
  archiveGrid: {
    kicker: "Archive preview",
    heading: "From the vault",
    body:
      "Preview standout editions from artist-official releases. Each card links to provenance and edition details.",
    viewAll: "View all",
    artwork: "Artwork",
  },
  marketing: {
    title: "Your collection, with the official record",
    body:
      "Browse the archive, manage the Vault, and pay on the web — view on the app. We offer non-fungible digital art experiences, not physical-asset or investment products.",
    buy: "Purchase & pay",
    openVault: "Open Vault",
  },
  artworks: {
    kicker: "Archive",
    title: "Artworks",
    body:
      "Browse authenticated digital art here. On each work page, check provenance and edition details.",
    back: "← Back home",
    editionLabel: "Edition:",
    paginationPrev: "Previous",
    paginationNext: "Next",
    paginationPageOf: "Page {current} of {total}",
  },
  artistArtworks: {
    title: "Artworks",
    body: "Works you have registered. Thumbnails are served only for pieces you still own.",
    empty: "No registered works to show. Confirm submission completed and the artist ID below.",
    devHint: 'Dev: append ?artist=ARTIST_ID to load works for that ID (e.g. Actor userId from the submit form).',
    backVault: "← Back to Vault",
    backHome: "← Back home",
  },
  vault: {
    overviewKicker: "Vault",
    overviewTitle: "Overview",
    overviewBody:
      "Check private collection status, notifications, and Chronicle updates on this screen.",
    balance: "Balance",
    activeBids: "Active bids",
    collectionTitle: "Collection",
    collectionBody: "Placeholder for owned editions.",
    activityTitle: "Activity",
    activityBody: "Placeholder for bids, payments, and Chronicle events.",
    settingsTitle: "Settings",
    settingsBody: "Placeholder for account, notifications, and security.",
    artistGateTitle: "Artist-only area",
    artistGateSubmitBody:
      "Artwork registration is available to artist accounts only. As a member (collector), use Collection, Activity, and other Vault areas. In production, access follows your signed-in role.",
    artistGateMyArtworksBody:
      "Managing registered works is available to artist accounts only. It is hidden from the standard member Vault.",
    artistGateSignupCta: "Register as an artist",
    artistGateBackVault: "← Back to Vault overview",
    demoSwitchArtist: "Demo: switch to artist mode",
    demoSwitchCollector: "Demo: switch to member mode",
  },
  tokushoho: {
    back: "← Back home",
    h1: "Specified commercial disclosures",
    statutory: "Based on Japan’s Act on Specified Commercial Transactions",
    intro:
      "The items below are a template. Finalize business details and update before publication.",
    nftNote:
      "This service uses NFT technology for non-fungible digital art experiences and is not intended to solicit physical assets or investment products.",
    sections: {
      sellerName: {
        title: "Seller name",
        hint: "(Enter the legal business name)",
      },
      operator: { title: "Responsible operator", hint: "(Enter the name)" },
      address: {
        title: "Address",
        hint: "(Address you can disclose without delay upon request)",
      },
      phone: {
        title: "Phone",
        hint: "(Customer contact; note if disclosed on request only)",
      },
      email: { title: "Email", hint: "(Contact address)" },
      extraFees: {
        title: "Fees other than product price",
        hint: "(Tax, shipping, payment fees, data charges if applicable)",
      },
      payment: {
        title: "Payment timing and method",
        hint: "(Card, invoice, provider names and timing)",
      },
      delivery: {
        title: "Delivery timing",
        hint: "(Digital delivery method/timing; shipping estimate if physical)",
      },
      returns: {
        title: "Returns, cancellation, defects",
        hint: "State digital-specific terms in line with applicable law.",
      },
      env: {
        title: "System requirements",
        hint: "(Recommended OS/browsers and supported app versions)",
      },
    },
  },
  sellerVerifyConsent: {
    overlayAriaLabel: "Establishing secure connection",
    overlayLine1: "Establishing a secure connection…",
    overlayLine2:
      "The Vault — preparing an encrypted session for your verification.",
    kicker: "OPUS · Seller",
    title: "Identity verification for seller privileges",
    subtitle: "Identity Verification",
    intro:
      "Under Japan’s Act on Prevention of Transfer of Criminal Proceeds and our operating policies, we conduct eKYC for seller settlement.",
    sectionHeading: "Required consent",
    requiredBadge: "[Required]",
    consentCollection:
      "Consent to collect and use personal information (name, date of birth, address, ID details)",
    consentSensitive:
      "Consent to process unique identification information (e.g. ID numbers)",
    consentThirdParty:
      "Consent to disclosure to third parties (identity providers such as Stripe Identity, Liquid eKYC)",
    dbNote:
      "OPUS does not store ID image paths or card numbers; only verification outcomes are linked.",
    back: "Back",
    next: "Continue",
    footerPrivacyMd: "Privacy (MD)",
    footerPrivacy: "Privacy policy",
    footerVault: "Vault",
    alertConsentFail: "Could not record consent. Please try again shortly.",
    alertNetwork: "Network error. Check your connection and try again.",
  },
  sellerVerifyStart: {
    title: "Verification session",
    body: "This screen is a placeholder before eKYC provider integration. A secure redirect or embedded flow will connect here soon.",
    backToConsent: "Back to consent",
    vaultLink: "Vault",
  },
};
