# Required follow-up

## Implemented locally

- [x] Assignment webshop features and project structure are present. README retains the five required sections and repository/demo links; deployment and manual verification remain separate.
- [x] Administration provides bilingual product/content editing, currency-aware prices, visibility, restoration, local orders, image ordering/uploads, export/import, reset and cleanup.
- [x] Web Locks, revision checks and storage events synchronize saved administration and reject stale saves. Unsaved drafts require explicit reload or confirmed retention.
- [x] Cleanup protects saved images, exports and active cross-tab drafts. Image headers/dimensions, static re-encoding, HTTPS URLs, external-host disclosure, export preflight limits and partial-import rollback are implemented.
- [x] Regression tests exist for administration safeguards, API pagination, edited catalogue processing, branding, cart reconciliation and historical orders. Browser tests include keyboard, mobile viewports and automated accessibility in both languages/themes; test presence does not establish a passing run.
- [x] Slow star/orbit animation respects reduced motion. Security headers remain configured for Netlify; GitHub Pages does not apply `netlify.toml`.

## Verification evidence

- [x] Documentation review on 2026-10-01: `npm test` passed all 25 unit tests. Browser tests, build, deployment, security scans and manual accessibility checks were not run during this review.
- [x] User-reported testing: a physical-phone test of the earlier storefront version was successful. This does not cover the newest administration/cross-tab changes or establish another-browser-engine coverage.
- Historical record: the initial public commit/ignore review reported no apparent credentials or non-example email addresses and excluded dependencies, builds, test output and environment files. This is not a current publication audit.
- Historical record: GitHub Pages publication had successful Actions, direct `/products/1` navigation, live products and checkout through confirmation. A later review recorded deployment inaccessibility. No dated deployment evidence is available here; neither result verifies the latest deployment.
- Historical record: Snyk Open Source checked 36 dependencies and reported no vulnerable dependency paths. No scan date or current rerun evidence is available here.
- Historical record: automated live search pagination/image fallback and fixture API retry checks were reported. Relevant tests remain, but these browser checks were not rerun during this review.
- Earlier completion marks for manual accessibility, usability observation and combined phone/other-engine coverage lack specific supporting results here. Keep the checks below open rather than treating those marks as verification.

## Required verification and fixes

- [ ] Verify the deployed revision. Check direct navigation/refresh for storefront and all administration routes under `/Abyrvalg/`, URL filters, live API/images and checkout through confirmation.
- [ ] Run current administration/safety browser tests against a fresh production build. Record results separately from deployment verification and unit tests.
- [ ] Test new administration on physical phones: editing, images, export/import, confirmations, navigation warnings and available cross-tab workflows over HTTPS with Web Locks.
- [ ] Test another browser engine separately from Chromium, including Web Locks, IndexedDB, downloads/imports and cross-tab conflicts. Record engine/device and outcomes.
- [ ] Perform manual keyboard/screen-reader checks across storefront/admin, including conflicts and feedback; review readability/contrast in both themes, zoom/mobile layout, reduced motion and forced colours. Automated checks are not WCAG certification.
- [ ] Where feasible, observe older or less technically experienced users completing shopping/admin tasks and record specific findings. Available evidence does not establish completed observation.
- [ ] Fix the confirmed backup round-trip limitation for legacy animated images: existing animations export, but re-import is rejected. Choose safe animation-preserving processing or an explicit migration path, then test restoration without silent animation loss.
- [ ] Check and safely clean obsolete `abyrvalg-draft:*` localStorage session keys. Current cleanup removes unused image blobs but leaves these keys. Use lifetime-lock evidence under the administration lock; preserve active/suspended tabs and stop safely on unreadable data.
- [ ] Investigate cross-tab product changes during the simulated checkout delay. `useCheckout` retains the starting `revalidate` callback across its await, which may use older configuration after cart reconciliation. Reproduce price, stock and visibility changes before confirming a defect; ensure the eventual order matches a reviewed current quote.
- [ ] Investigate transfer feedback when cleanup fails after successful import/reset. Configuration may already be saved although a generic failure is shown; test IndexedDB/storage errors and clarify the committed result if reproduced.

## Only if moving to Netlify

- [ ] After an authorised migration/deployment, verify direct routes, SPA fallback, API/images, actual response headers and purchase flow in a private browser session. Migration is not required by the current assignment.

## Only if this becomes a real shop

- [ ] Provide verified seller details, sales/delivery/returns terms and privacy documentation.
- [ ] Replace local demo data with a secure backend, authentication, durable orders, real payment and fulfilment.
