export type ConsoleMessages = {
  /** ISO-ish language labels for the switcher (native script). */
  lang: { ja: string; ko: string; en: string };
  login: {
    title: string;
    lead: string;
    email: string;
    password: string;
    submit: string;
    submitting: string;
    registerPrompt: string;
    registerLink: string;
    invitationNote: string;
    continueWithGoogle: string;
    orEmail: string;
    publicSite: string;
    previewOpen: string;
    previewEnvHint: string;
    notOperator: string;
    signOut: string;
    banners: {
      checkEmail: string;
      verified: string;
      linkExpired: string;
      linkInvalid: string;
      registerClosed: string;
    };
    resend: {
      summary: string;
      details: string;
      hint: string;
      emailPlaceholder: string;
      send: string;
      sending: string;
      sent: string;
      failed: string;
    };
  };
  register: {
    title: string;
    lead: string;
    email: string;
    nameOptional: string;
    password: string;
    passwordHint: string;
    passwordConfirm: string;
    submit: string;
    submitting: string;
    signInPrompt: string;
    signInLink: string;
    back: string;
    acceptTos: string;
    acceptPrivacy: string;
    acceptOverseas: string;
    acceptAge: string;
    acceptMarketing: string;
  };
  review: {
    title: string;
    subtitle: string;
    loadError: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    cardSubmissionsTitle: string;
    cardSubmissionsBody: string;
    /** `{count}` = items in pending_review + changes_requested (same as review queue). */
    cardSubmissionsPendingCountTpl: string;
    /** When the storefront submissions list could not be loaded (home card badge). */
    cardSubmissionsCountUnavailable: string;
    /** Shown under the large numeric count on the home “pending” card (e.g. 건 / 件). */
    cardSubmissionsCountSuffix: string;
    cardSubmissionsCta: string;
    cardPaymentsTitle: string;
    cardPaymentsBody: string;
    cardPaymentsBadge: string;
    cardHealthTitle: string;
    cardHealthBody: string;
  };
  chrome: {
    brand: string;
    navHome: string;
    navReview: string;
    navPayments: string;
    submissions: string;
    submissionsLead: string;
    backToReview: string;
    signOut: string;
    previewTitle: string;
    previewBody: string;
    notSignedIn: string;
    mobilePreview: string;
  };
  errors: {
    loginEmailPasswordRequired: string;
    loginInvalid: string;
    registerEmailInvalid: string;
    registerPasswordMismatch: string;
    registerPasswordShort: string;
    registerPasswordLetter: string;
    registerPasswordNumber: string;
    registerConsentRequired: string;
    registerOverseasRequired: string;
    registerAgeRequired: string;
    registerAlreadyRegistered: string;
    registerEmailUsedStorefront: string;
    registerDuplicateEmail: string;
    registerMailFailed: string;
    registerInviteInvalid: string;
  };
};
