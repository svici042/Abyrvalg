# Browser-local administration

Administration is an unauthenticated school demo. Use fictional customer data. Changes affect this browser profile and origin, not DummyJSON or other visitors. Paths on the same origin share storage; a real shop requires an isolated origin, secure backend, authentication and appropriate customer-data handling.

## Catalogue and editing

Storefront normally uses API pagination (`limit=12`, `skip`) and original API search text. Any saved product override switches to a separately cached full catalogue: apply edits, hide products, then search/filter/sort/paginate locally. Content-only edits do not trigger this mode. Administration always loads the full catalogue and filters before local 12-item pagination, including hidden products. Editing retains filters/page; shrinking results clamp the page.

Product editing covers NO/EN text, USD base price (NOK demo rate 10.5), category slug, brand, stock, visibility and gallery ordering/main image. Content editing covers name, logo, hero, announcement, footer and fictional contact. Copyright remains Bim & Bom independently of branding. Individual restoration removes an override. Reset removes administration configuration, preserving cart, preferences and orders; orders have separate deletion controls.

Cart reconciles current prices, stock and visibility. Checkout validates the latest cart before and after simulated processing and rejects a changed reviewed quote. Orders retain historical snapshots.

## Storage, conflicts and cleanup

localStorage holds configuration under `abyrvalg-admin`, preferences, cart, recent products and fictional orders; IndexedDB `abyrvalg-images` holds uploads. Browser eviction can remove data. Back up important demo work.

Administration writes, image operations and transfers require HTTPS/localhost and Web Locks. Storage events synchronize saved administration between tabs, not all cart/preferences/orders. Shared locks, revisions and comparison with stored data reject stale saves even before an event arrives.

Unsaved drafts remain intact on conflict. Reload saved data or explicitly keep the draft; the next save replaces that product/content in the latest configuration while preserving unrelated changes. Further external changes create a new conflict. Storage failures are reported.

Cleanup protects saved, exported and active-draft image references, including suspended tabs. Obsolete `abyrvalg-draft:*` keys are snapshotted before checking held/pending lifetime locks and validated before removal. New tabs and unrelated keys are preserved; unreadable storage stops deletion. Closed-tab leftovers can be cleaned by later editing or the cleanup button.

## Images and privacy

- Static JPEG, PNG, WebP and GIF only for normal uploads; SVG is rejected.
- At most 5 MiB per image, 4096 pixels per side, 16 million canvas pixels; 30 gallery images or one logo.
- Headers/dimensions are checked before decoding. Canvas re-encodes JPEG as JPEG and other formats as PNG without original metadata, still within the size limit.
- Legacy animated GIF/APNG/WebP backup restoration requires explicit consent to retain original bytes **and metadata**. Limits include 300 frames and 64 million cumulative frame pixels. Normal animation uploads remain rejected; cancellation preserves saved configuration. Import only trusted backups.
- Missing uploads use fallback rendering. External HTTPS images bypass local re-encoding and file limits, require network and may disappear. Legacy HTTP references remain stored but are blocked and must be replaced before save/import.
- Import confirmation identifies external image hosts. Images send no referrer, but hosts still receive requests/IP addresses; this is not anonymous fetching.

## Export/import failure handling

JSON includes administration configuration and uploaded image bytes, not cart, preferences, orders or customer fields. External images remain URLs. Export preflight counts UTF-8 overhead, MIME prefixes and padded Base64 before allocation, with a running 50 MiB limit and progress. Missing uploads stop export.

Import has the same file limit, explicit confirmation and schema/value/language/image validation. Images are processed sequentially with new IDs before saving configuration. Pre-save failures preserve previous configuration and attempt image rollback. Cleanup failures after a committed import/reset explicitly report the saved outcome and advise retrying cleanup. Limits do not guarantee enough browser memory or storage.

## Production policies

Vite production builds derive HTML CSP from `netlify.toml`, omitting header-only `frame-ancestors`; development needs Vite's injected styles/scripts. Pages fallback HTML has a restrictive policy and external restoration scripts. HTML CSP permits same-origin scripts/styles, DummyJSON connections and local/blob/HTTPS images, with `no-referrer`.

GitHub Pages does not apply Netlify headers. HTML CSP supplies no framing protection or `nosniff`. Netlify additionally configures CSP framing protection, X-Frame-Options, nosniff, HSTS and Permissions-Policy. Verify actual headers after an authorised deployment; local tests do not verify the published revision.

## Focused production tests

Build normally with `npm run build`, then set `$env:PLAYWRIGHT_PREVIEW='1'` in PowerShell and run `npx playwright test tests/browser/admin-safety.spec.js`. Use `--grep 'closed-tab uploads become eligible' --repeat-each=20 --workers=2 --retries=0 --trace=on` for bounded cleanup investigation. Test completion must follow the cleanup status and release of the closed tab's specific lifetime lock, not merely `click()`/`close()` resolving.

For local Pages direct-route/refresh tests, set `$env:GITHUB_PAGES='true'`, build, then run `npx playwright test --config=playwright.pages.config.js`. Clear that variable before a later normal build. These commands test local artifacts, not the public deployment.
