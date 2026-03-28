/**
 * OPUS identity tiers — step-up verification ("authenticate when permission is needed").
 * SECURITY_GOVERNANCE.md §1.1 · ISO 27001 A.18.1.4 (§7) APPI / data minimization
 *
 * KO: 전원 신분증 수집을 하지 않고, 일반 이용자·R-18·판매자에 따라 요구 수준을 나눈다.
 * JA: 全員の身分証収集は行わず、一般・R-18・出品者で要件を分ける。
 * EN: No ID for everyone; requirements differ for general buyers, R-18, and sellers.
 */

/** Buyer baseline: OAuth + self-attested 18+ checkbox (no government ID). */
export const IDENTITY_TIER_BUYER_BASE = "buyer_base" as const;

/** R-18 purchase/view: credit-card–based age verification (vendor-held PAN; ref-only in OPUS). */
export const IDENTITY_TIER_R18_CARD = "r18_credit_card" as const;

/** Seller: professional eKYC (ID + face via vendor; no image paths in OPUS DB). */
export const IDENTITY_TIER_SELLER_EKYC = "seller_ekyc" as const;

export type IdentityTier =
  | typeof IDENTITY_TIER_BUYER_BASE
  | typeof IDENTITY_TIER_R18_CARD
  | typeof IDENTITY_TIER_SELLER_EKYC;
