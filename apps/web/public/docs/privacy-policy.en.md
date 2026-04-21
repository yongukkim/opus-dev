# OPUS Privacy Policy

This policy describes how OPUS (the "Service") collects, uses, stores, and disposes of your personal information. The Service is designed according to the principles of **Security by Design** and **Privacy by Design**, and is intended to comply with Japan's **Act on the Protection of Personal Information (APPI)**, Korea's **Personal Information Protection Act (PIPA)**, and — where applicable — the **EU / UK General Data Protection Regulation (GDPR)**. This document is a **pre-finalization draft** and will be reconciled with final legal review per jurisdiction.

---

## 1. Operator and Contact

- **Operating entity (tentative)**: [Insert legal name]
- **Data Protection Officer / Personal Information Protection Manager (tentative)**: [Insert role, name, or contact window]
- **Contact**: [Insert email address or dedicated form URL]

---

## 2. Personal Information We Collect

Depending on the stage of service usage, we may collect the following items.

- **Account & authentication**: email address, password (stored only in a hashed, **non-reversible** form), display name, role (artist, collector, etc.)
- **Service usage**: metadata for **non-reproducible digital artworks**, editions, provenance, and ownership history (The Chronicle and linked records)
- **Technical information**: IP address, cookies and local storage, device and browser information, access and usage logs
- **Analytics (where applicable)**: **de-identified and aggregated** usage statistics (e.g., page views, event counts). Analytics are designed to not directly identify individuals.

---

## 3. Purposes of Use

- Member identification, login and session management, prevention of abuse
- Delivering the ownership, provenance, and viewing experience of **authenticated digital editions**, and maintaining the **integrity and auditability** of **The Chronicle**
- Customer support, announcements, notice of terms and policy changes
- Service quality improvement (statistics, security monitoring, logs with **minimal PII exposure**)

The Service may employ **NFT and distributed-ledger technology** as a **technical means**, but does not process personal information for the purposes of **investment, yield, or financial products**.

---

## 4. The Vault and Cryptographic / Security Controls

OPUS applies encryption and access controls to sensitive data **at rest** and **in transit**.

- **The Vault**: a logical **private storage and processing zone** within operating infrastructure. Personal information, submitted assets, and audit logs are stored — strictly on a **need-to-know, least-privilege basis** — only in this zone or an environment with equivalent control level.
- **Encryption**: transport is protected by industry-standard **TLS**. Data at rest is protected with **encrypted storage and encrypted backups** (specific algorithms and key management follow internal security and infrastructure documents).
- **Access control**: **least-privilege RBAC**, separation of operation and development, and audit logs with **masking of identifiers** by default.
- **Integrity**: zones requiring **immutable, append-only** records (e.g., The Chronicle) support **integrity verification** via hash chaining and similar mechanisms. Even in such zones, **direct identifiers** are **separated and minimized** whenever feasible.

---

## 5. Third-Party Disclosure and Processing Consignment

- As a general rule, we do not provide personal information to third parties without your consent (APPI Art. 27, PIPA Art. 17).
- Where **processing is consigned** to a contractor (hosting, payment processing, analytics tools, etc.), we require contractual **prohibition of use beyond the purpose** and **technical and organizational safeguards**, and disclose **contractors and processing scope** in this policy or a linked annex (APPI Art. 25, PIPA Art. 26).

---

## 6. Cross-Border Transfer to Third Parties

When you choose **Google Sign-In or sign-up**, your personal information is transferred outside your country of residence to Google LLC in the United States for authentication purposes. Consent to this transfer is included in the **"I agree to the Terms of Service and Privacy Policy"** checkbox on the sign-up / login screen, and its specific contents are disclosed in this section in advance. This section is designed to cover the information required by **APPI Art. 28** (provision to third parties in a foreign country), **PIPA Art. 28-8(2)** (prior notice of outbound transfer), and, where applicable, **GDPR Chapter V** (transfers to third countries).

### 6.1 Google LLC (United States) — Account Authentication

| Disclosure Item | Content |
| --- | --- |
| Recipient | **Google LLC** |
| Recipient country | **United States of America** |
| Timing & method of transfer | At the moment you **elect** Google Sign-In or sign-up, via HTTPS-based **OAuth 2.0 / OpenID Connect** standard flow |
| Categories transferred | Email address, Google display name, profile image URL, Google account unique identifier (OIDC `sub`) |
| Recipient's purpose of use | User identification, issuance of authentication tokens, maintenance of service login state |
| Recipient's retention period | On Google's side, governed by Google's Privacy Policy. On OPUS's side, retained until your **account deletion** or **consent withdrawal** |
| Safeguards | TLS transport encryption, minimized OAuth scopes (profile and email only), access control (RBAC) and audit logging within OPUS internal storage |
| PI protection framework in recipient country | The United States has no single comprehensive federal privacy law; enforcement is sectoral and through the **FTC Act §5** (prohibition on unfair or deceptive practices). Google LLC implements protections through its Privacy Policy, applicable Standard Contractual Clauses (SCCs), and aligns processor-side controls with the EU General Data Protection Regulation. |
| Measures taken by recipient | Internal controls aligned with the OECD Privacy Principles, industry-standard encryption, and GDPR-aligned processor agreements |
| Method of withdrawing consent | You may refuse this transfer by **not selecting** Google Sign-In. After a transfer has occurred, you may withdraw consent via OPUS **account deletion** request. |

### 6.2 Other Cross-Border Transfers

Any cross-border transfer outside 6.1 (e.g., addition of another OAuth provider, overseas analytics or hosting contractors) will be disclosed in this Section 6 — recipient, country, items, period, right to refuse, and safeguards — **before that processing begins**. Changes are announced via in-service notice and/or email.

### 6.3 Notes for EEA / UK Residents

Where GDPR applies, transfers outside the EEA / UK rely on (i) the European Commission's adequacy decisions where available, (ii) **Standard Contractual Clauses (SCCs)** of the applicable Commission or UK variant, and (iii) supplementary safeguards as needed. You may request a copy of the safeguards in use for your data.

---

## 7. Your Rights

You may request the following with respect to your personal data.

- **Access** (APPI Art. 33, PIPA Art. 35, GDPR Art. 15)
- **Correction / addition / deletion** for inaccurate data (APPI Art. 34, PIPA Art. 36, GDPR Art. 16)
- **Cessation of use / erasure** (APPI Art. 35, PIPA Art. 37, GDPR Art. 17 "right to be forgotten")
- **Suspension of third-party provision** (APPI Art. 35, PIPA Art. 37)
- **Data portability**, where applicable (GDPR Art. 20)
- **Withdrawal of consent** at any time, through the service settings or the contact window

Requests are processed within a reasonable period after verifying your identity, subject to statutory exceptions and the integrity requirements of The Chronicle (see Section 8).

---

## 8. Retention and Disposal

- Upon **account closure** or **expiry of the retention period**, related personal information is **disposed of without delay**. Where a statute requires longer retention, we keep the data separately until the statutory period ends and then dispose of it.
- Records kept for **audit and integrity** purposes — such as **The Chronicle** — may be retained **indefinitely** in blockchain, hash, or immutable log form. Even in such cases, **direct identifiers** are **separated and de-identified** to the extent technically feasible.

---

## 9. Cookies and Similar Technologies

The Service uses cookies and similar technologies for **session, preferences, and security** purposes. Analytics cookies, where consent is required, are gated behind a separate consent UI.

---

## 10. Children's Personal Information

The Service does **not knowingly collect** personal information from **persons under 16 years of age** (or the age of a child under the applicable jurisdiction). If we become aware of such collection, we will **delete the information without delay**.

---

## 11. Breach Notification

If a personal-data breach occurs and meets the reporting thresholds of APPI (Art. 26, Enforcement Regulations Art. 7), PIPA, or GDPR (Art. 33 & 34), we will promptly **notify the supervisory authority** (PPC, PIPC, EU DPA) and **affected individuals** as required.

---

## 12. Changes to This Policy

We may amend this policy when laws or services change. **Material changes** are announced via in-service notice or email, with adequate lead time where legally required.

---

*Document version: draft | Last updated: [YYYY-MM-DD] | Next review: legal & jurisdictional alignment*
