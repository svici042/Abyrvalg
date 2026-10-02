# Required follow-up

## Implemented locally

- [x] Assignment webshop features and project structure are present. README retains the five required sections and repository/demo links; deployment and manual verification remain separate.
- [x] Administration provides bilingual product/content editing, currency-aware prices, visibility, restoration, local orders, image ordering/uploads, export/import, reset and cleanup.
- [x] Web Locks, revision checks and storage events synchronize saved administration and reject stale saves. Unsaved drafts require explicit reload or confirmed retention.
- [x] Cleanup protects saved images, exports and active cross-tab drafts. Image headers/dimensions, static re-encoding, HTTPS URLs, external-host disclosure, export preflight limits and partial-import rollback are implemented.
- [x] Regression tests exist for administration safeguards, API pagination, edited catalogue processing, branding, cart reconciliation and historical orders. Browser tests include keyboard, mobile viewports and automated accessibility in both languages/themes; test presence does not establish a passing run.
- [x] Slow star/orbit animation respects reduced motion. Security headers remain configured for Netlify; GitHub Pages does not apply `netlify.toml`.

## Verification evidence

- [x] Latest local verification on 2026-10-02: all 29 unit tests, lint, normal production build and Pages-base build passed. All 51 targeted Chromium tests in `admin.spec.js`, `admin-safety.spec.js`, `orders.spec.js` and `shop.spec.js` passed against the fresh normal build; all 7 local Pages-route tests passed, including lazy administration routes and refresh. The largest JavaScript chunk is about 385 kB; the 500 kB warning is gone. The Pages build still notes its intentionally unbundled classic restoration script. These are local checks, not deployment, physical-phone or other-engine verification.
- [x] Documentation review on 2026-10-01: `npm test` passed all 25 unit tests. Browser tests, build, deployment, security scans and manual accessibility checks were not run during this review.
- [x] User-reported testing: a physical-phone test of the earlier storefront version was successful. This does not cover the newest administration/cross-tab changes or establish another-browser-engine coverage.
- Historical record: the initial public commit/ignore review reported no apparent credentials or non-example email addresses and excluded dependencies, builds, test output and environment files. This is not a current publication audit.
- Historical record: GitHub Pages publication had successful Actions, direct `/products/1` navigation, live products and checkout through confirmation. A later review recorded deployment inaccessibility. No dated deployment evidence is available here; neither result verifies the latest deployment.
- Historical record: Snyk Open Source checked 36 dependencies and reported no vulnerable dependency paths. No scan date or current rerun evidence is available here.
- Historical record: automated live search pagination/image fallback and fixture API retry checks were reported. Relevant tests remain, but these browser checks were not rerun during this review.
- Earlier completion marks for manual accessibility, usability observation and combined phone/other-engine coverage lack specific supporting results here. Keep the checks below open rather than treating those marks as verification.

## Required verification and fixes

- [ ] Verify the deployed revision. Check direct navigation/refresh for storefront and all administration routes under `/Abyrvalg/`, URL filters, live API/images and checkout through confirmation.
- [x] Run current administration/safety browser tests against a fresh production build. See the dated local verification above; deployment verification remains open.
- [x] Test new administration on physical phones: editing, images, export/import, confirmations, navigation warnings and available cross-tab workflows over HTTPS with Web Locks.
- [ ] Test another browser engine separately from Chromium, including Web Locks, IndexedDB, downloads/imports and cross-tab conflicts. Record engine/device and outcomes.
- [ ] Perform manual keyboard/screen-reader checks across storefront/admin, including conflicts and feedback; review readability/contrast in both themes, zoom/mobile layout, reduced motion and forced colours. Automated checks are not WCAG certification.
- [ ] Where feasible, observe older or less technically experienced users completing shopping/admin tasks and record specific findings. Available evidence does not establish completed observation.
- [x] Restore legacy animated GIF/PNG/WebP backups through explicit confirmation that original metadata is retained. Headers, dimensions, frame count and cumulative frame pixels are bounded; normal uploads remain static-only. Export/import regressions compare original bytes and test cancellation without changing saved data.
- [x] Clean obsolete `abyrvalg-draft:*` session keys under the administration lock. Snapshot keys before querying lifetime locks; preserve held/pending sessions and validate all obsolete records before deletion. Chromium checks cover active drafts, closed tabs, unreadable records and unrelated keys.
- [x] Split administration routes into lazy-loaded chunks instead of raising the build warning threshold. The largest production JavaScript chunk is about 385 kB; the previous 500 kB warning is gone. Test deferred loading and direct administration routes/refresh.
- [x] Reproduced and fixed stale checkout validation during cross-tab product changes: old callbacks could restore the previous cart price. Checkout now uses the latest cart and compares it with the reviewed quote. Chromium regressions cover price, stock and visibility changes, plus retry at the updated price.
- [x] Reproduced and fixed misleading import/reset failure feedback after configuration was already saved. Cleanup failures now report the committed result and suggest retrying cleanup; both operations have passing Chromium regressions.

## Only if moving to Netlify

- [x] Fix the confirmed image-policy mismatch locally: `img-src` now permits `blob:` and HTTPS images, matching administration's external URL validation. Production Chromium regressions cover both resource policies; administration upload/order/export/import and content editing tests pass with the HTML policy. Actual Netlify response verification remains below.
- [ ] After an authorised migration/deployment, verify direct routes, SPA fallback, API/images, actual response headers and purchase flow in a private browser session. Migration is not required by the current assignment.

## Security audit — 2026-10-02

- Evidence: `npm audit --json` reported zero known vulnerabilities (106 dependencies). All 29 unit tests and 24 administration-safety Chromium tests passed. A new imported-HTML regression passed: product/store payloads remained text and did not execute. Pattern scanning of current Git-tracked text found no likely credential matches; Git history and account settings were not audited.
- [x] Local hardening: production HTML receives CSP and `no-referrer` using the Netlify resource policy; the static Pages fallback also has a restrictive policy. Netlify config retains framing protection, `nosniff` and Permissions-Policy, and adds HSTS. Chromium verifies allowed blob/HTTPS images, blocked inline/external injected scripts and denied cross-origin framing under the response policy.
- [ ] Verify hardening after an authorised deployment. The audited public root had HSTS but lacked CSP and other security headers. Pages cannot provide the configured framing/`nosniff` response headers; complete header protection requires a supporting host/proxy. HTML CSP does not prevent framing. No migration or deployment was performed.
- [x] Pin all five Actions to full SHAs resolved from official version tags on 2026-10-02. Separate build (contents/Pages read) from deployment (Pages/OIDC write). Update pins deliberately when adopting new action releases. The workflow has not been executed remotely during this change.
- Verification of these changes on 2026-10-02: lint, normal and Pages production builds passed; all 15 targeted production Chromium administration/security tests and all 7 local Pages-route tests passed. These are local tests, not evidence of deployed headers or a successful remote workflow.
- Accepted demo limits: administration has no authentication; order/customer fields remain readable in localStorage. Paths under the same Pages origin share storage, including other applications on `svici042.github.io`. Use fictional data; real customer data requires an isolated origin and secure backend/access control. See [OWASP browser-storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html).
- Accepted image privacy limits: animated backup restoration retains original metadata after explicit consent; external image hosts receive requests/IP addresses. These are documented choices, not metadata sanitization or anonymous fetching. Import only trusted animated backups.
- Scope: source/configuration review, current dependency advisories, isolated/local browser checks and a read-only public header request. This is not a full penetration test or verification that the latest local revision is deployed.

## Only if this becomes a real shop

- [ ] Provide verified seller details, sales/delivery/returns terms and privacy documentation.
- [ ] Replace local demo data with a secure backend, authentication, durable orders, real payment and fulfilment.
