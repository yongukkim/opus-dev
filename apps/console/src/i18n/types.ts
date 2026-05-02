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
  chrome: {
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
