# Current follow-up

## Required investigation

- [ ] Investigate closed-tab cleanup if the intermittent failure recurs. The original cause is unconfirmed and the old trace unavailable; repeated runs passed. Test synchronization fixes do not establish the cause. On recurrence, retain the trace and capture session locks, published references and cleanup feedback/count before and after tab closure to check whether deletion ran while the draft was protected. Do not add retries or weaken protection assertions.

## Remaining manual and live checks

- [ ] Verify the deployed revision and its direct storefront/admin routes, refresh, filters, live API/images, checkout and actual security policy. Local tests do not verify deployment.
- [ ] Test current administration on physical phones: editing, uploads, transfers, confirmations, navigation warnings and available cross-tab workflows. User-reported phone success covered only the earlier storefront.
- [ ] Test another browser engine independently of Chromium: Web Locks, IndexedDB, transfers and conflicts.
- [ ] Complete manual keyboard/screen-reader, zoom, contrast, reduced-motion and forced-colours checks in both languages/themes. Automated accessibility tests are not WCAG certification.

## Latest relevant verification

2026-10-02: formatting of touched files, six local documentation links, lint, 29 unit tests and production build passed. Original and synchronized closed-tab cleanup tests each passed 20/20 bounded production Chromium runs without retries; 13 related upload/cleanup/conflict/rollback checks passed. Phones, other engines, screen readers and deployment remain unverified; the original cleanup cause remains unknown.

## Conditional hosting or real-shop work

- [ ] If moving to Netlify or another host/proxy, verify SPA routes and actual framing, CSP, nosniff and other response headers after authorised deployment. Pages ignores `netlify.toml`; HTML CSP cannot supply framing protection or nosniff. Migration is optional.
- [ ] Before real sales, use an isolated origin, secure backend/authentication, durable orders, real payment/fulfilment, appropriate customer-data handling and verified seller/privacy/returns terms. Browser storage is shared across paths on one origin; demo orders must remain fictional.

Optional enhancements belong in [NICE_TO_HAVE](NICE_TO_HAVE.md).
