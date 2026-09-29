# Required follow-up

## Completed and verified for the demo

- [x] Reviewed the initial public commit and ignore rules. The tracked set excludes dependencies, builds, test output, and environment files; the source scan found no apparent credentials or non-example email addresses.
- [x] README contains the five assignment sections and links to the repository and published demo.
- [x] Published on GitHub Pages at https://svici042.github.io/Abyrvalg/. The Actions workflow succeeded; direct `/products/1` navigation, live product loading, and the demo checkout through confirmation were checked.

## Still to verify

- [ ] Compare the implementation with the original React webshop brief and confirm every submission requirement; the brief is not in this workspace.
- [ ] Manually assess keyboard and screen-reader flows, text readability and contrast in both themes, zoom/mobile use, and system reduced-motion and forced-colour behaviour. Automated checks are not WCAG certification.
- [ ] Where feasible, observe older or less technically experienced users completing the main shopping tasks and record usability issues.
- [ ] Check layout and interaction on physical phones and another browser engine; current browser coverage uses Chromium.
- [ ] Verify real DummyJSON search and pagination across pages, plus helpful behaviour during transient API or image failures. The live checks cover catalogue, search/category sorting, direct product loading, and the purchase flow; other search/pagination cases use fixtures.
- [ ] Decide whether custom security headers are required. GitHub Pages responses currently lack CSP, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and `X-Content-Type-Options`; `netlify.toml` does not apply there.

## Only if moving to Netlify

- [ ] After an authorised Netlify deployment, verify direct routes, SPA fallback, API/images, actual response headers, and the complete purchase flow in a private browser session.

## Only if this becomes a real shop

- [ ] Provide verified seller details, sales/delivery/returns terms, and privacy documentation.
- [ ] Replace local demo orders with a secure backend, authentication, durable order storage, real payment, and fulfilment.
