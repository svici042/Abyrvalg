# Required follow-up

## Before the first commit

- [ ] Review the exact Git file set and ignore rules once the project is in its intended repository. This workspace has no `.git`, so staged/tracked files and ignored build or test output cannot yet be confirmed.
- [ ] Check the proposed commit for credentials, private data, generated artifacts, and demo customer records. A source search found no apparent credentials; the customer examples use fictional `.test` addresses. Review the actual commit contents before committing.

## Assignment and user verification

- [x] README includes the five required assignment sections: app, technology choices, local setup, folder structure, and limitations/next steps.
- [ ] Compare the project with the original React webshop brief and confirm every required feature and submission criterion; the brief is not present in this workspace.
- [ ] Add the GitHub repository link to the submission when the repository exists.
- [ ] Add the live deployment link only after an authorised publication.
- [ ] Manually check keyboard and screen-reader flows, text readability and contrast in both themes, zoom and mobile use, and system reduced-motion and forced-colour modes. Automated checks have coverage for these settings but do not establish WCAG conformance.
- [ ] Where feasible, observe older or less technically experienced users completing the main shopping tasks and record usability issues.
- [ ] Check layout and interaction on physical phones and in another browser engine; current browser coverage uses Chromium emulation.
- [ ] Verify real DummyJSON search and pagination across pages and confirm helpful behaviour during transient API or image failures. Existing live checks cover catalogue, category/search sorting and direct product refresh; search and pagination behaviour otherwise uses test fixtures.

## After an authorised Netlify deployment

- [ ] Check live direct product URLs and SPA fallback, plus API and image loading.
- [ ] Inspect actual response security headers, including CSP, on the deployed site; `netlify.toml` and localhost do not verify production responses.
- [ ] Complete the purchase flow in a private browser session and confirm the deployed demo behaves as described.

## Only if this becomes a real shop

- [ ] Provide verified seller details and sales, delivery, returns, and privacy terms.
- [ ] Replace local demo orders with a secure backend, real authentication, durable order storage, payment integration, and fulfilment processes.
