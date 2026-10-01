# Required follow-up

## Completed and verified for the demo

- [x] Reviewed the initial public commit and ignore rules. The tracked set excludes dependencies, builds, test output, and environment files; the source scan found no apparent credentials or non-example email addresses.
- [x] README contains the five assignment sections and links to the repository and published demo.
- [x] Published on GitHub Pages at https://svici042.github.io/Abyrvalg/. Earlier checks recorded a successful Actions workflow, direct `/products/1` navigation, live product loading, and demo checkout through confirmation; the current deployment was inaccessible during the latest review and should be rechecked before submission.
- [x] Snyk Open Source test checked 36 dependencies and found no vulnerable dependency paths.

## Still to verify

- [x] Compared the implementation with the original React webshop assignment. The required app features and project structure are present; deployment checks and the manual checks below remain separate.
- [ ] Manually assess keyboard and screen-reader flows, text readability and contrast in both themes, zoom/mobile use, and system reduced-motion and forced-colour behaviour. Automated checks are not WCAG certification.
- [ ] Where feasible, observe older or less technically experienced users completing the main shopping tasks and record usability issues.
- [ ] Check layout and interaction on physical phones and another browser engine; current browser coverage uses Chromium.
- [x] Automated checks verify live DummyJSON search results across two pages and the product-image fallback after image requests fail. Fixture checks cover transient API errors and retry behaviour; these checks do not replace deployed-site testing.
- [x] Decision: custom security headers are not required by the course assignment; retain the configured Netlify headers for hosts that support them. GitHub Pages does not apply `netlify.toml` headers.

## Only if moving to Netlify

- [ ] After an authorised Netlify deployment, verify direct routes, SPA fallback, API/images, actual response headers, and the complete purchase flow in a private browser session.

## Only if this becomes a real shop

- [ ] Provide verified seller details, sales/delivery/returns terms, and privacy documentation.
- [ ] Replace local demo orders with a secure backend, authentication, durable order storage, real payment, and fulfilment.
