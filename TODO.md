# Current follow-up

## Implemented locally

- [x] Webshop and browser-local NO/EN administration, filtered product pagination, editable branding, fixed Bim & Bom copyright and accessible 40/60-second hero pause/reduced-motion behaviour.
- [x] Revision/lock safeguards, explicit draft conflicts, checkout quote revalidation, validated transfers, image privacy/limits and protected cleanup. See [administration details](docs/ADMINISTRATION.md).
- [x] Lazy administration routes, production HTML CSP, compatible Netlify image policy and SHA-pinned Actions with deployment-only write permissions. LF text convention is defined in `.gitattributes`.
- [x] Cleanup test now waits for upload/session publication, completed cleanup feedback and release of the closed tab's exact lifetime lock; active-image and final orphan/session assertions remain strict.

## Required investigation

- [ ] Identify the original intermittent closed-tab cleanup failure if it recurs. Its old failure trace is unavailable; the original test passed 20/20 bounded production runs, so the original cause is unconfirmed. Missing completion/lock-release barriers were corrected in the test, not established as the cause. On recurrence, retain the trace and capture held/pending session locks, published references and cleanup feedback/count before and after closing the tab; determine whether deletion ran while its draft was still protected. Do not add retries or weaken protection assertions.

## Remaining manual and live checks

- [ ] Verify the deployed revision and its direct storefront/admin routes, refresh, filters, live API/images, checkout and actual security policy. Local tests do not verify deployment.
- [ ] Test current administration on physical phones: editing, uploads, transfers, confirmations, navigation warnings and available cross-tab workflows. User-reported phone success covered only the earlier storefront.
- [ ] Test another browser engine independently of Chromium: Web Locks, IndexedDB, transfers and conflicts.
- [ ] Complete manual keyboard/screen-reader, zoom, contrast, reduced-motion and forced-colours checks in both languages/themes. Automated accessibility tests are not WCAG certification.

## Latest relevant verification

2026-10-02: touched-file formatting, six local documentation links, lint, all 29 unit tests and a fresh normal production build passed. Original and synchronized closed-tab cleanup tests each passed 20/20 bounded Chromium runs without retries; all 13 nearby upload/cleanup/conflict/rollback checks passed. Traces are retained in ignored test output. This does not explain the original failure or verify phones, other engines, screen readers or deployment.

## Conditional hosting or real-shop work

- [ ] If moving to Netlify or another host/proxy, verify SPA routes and actual framing, CSP, nosniff and other response headers after authorised deployment. Pages ignores `netlify.toml`; HTML CSP cannot supply framing protection or nosniff. Migration is optional.
- [ ] Before real sales, use an isolated origin, secure backend/authentication, durable orders, real payment/fulfilment, appropriate customer-data handling and verified seller/privacy/returns terms. Browser storage is shared across paths on one origin; demo orders must remain fictional.

Optional enhancements belong in [NICE_TO_HAVE](NICE_TO_HAVE.md).
