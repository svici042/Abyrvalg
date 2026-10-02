# Abyrvalg

## 1. Appbeskrivelse

Abyrvalg er en responsiv nettbutikkdemo for en skoleoppgave, med produkter fra DummyJSON. Søk, kategori, sortering, handlekurv og lokal demoordre er tilgjengelig. Ingen ekte betaling, lagerreservasjon eller levering skjer. Bruk bare oppdiktede kundeopplysninger.

Velg norsk/engelsk, NOK/USD og lyst/mørkt tema. Kurv, preferanser, nylig sette produkter, demoordre og administrasjonsendringer lagres i nettleseren. NOK bruker demokursen 10,5 per USD. Stjerne/bane-animasjonen har pauseknapp og følger systemets reduserte bevegelse.

Demo: [GitHub Pages](https://svici042.github.io/Abyrvalg/) · [Kildekode](https://github.com/svici042/Abyrvalg).

| Rute                                 | Innhold                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| `/`, `/products/:id`                 | Katalog og produktdetaljer                                                       |
| `/cart`, `/checkout`, `/orders/:id`  | Kurv, demokasse og ordrebekreftelse                                              |
| `/admin`                             | Lokal demo, sikkerhetskopi, import, nullstilling og opprydding                   |
| `/admin/products`                    | Produktredigering, bilder, synlighet og gjenoppretting; filtrert liste med sider |
| `/admin/content`                     | NO/EN-butikknavn, logo, banner, kunngjøring, bunntekst og fiktiv kontakt         |
| `/admin/orders`, `/admin/orders/:id` | Lokale ordre og status/sletting                                                  |

På Pages ligger rutene under `/Abyrvalg/`. Copyright er alltid Bim & Bom, uavhengig av redigert butikknavn.

## 2. Teknologivalg og grunner

React/Vite gir komponenter og rask utvikling; React Router håndterer ruter og laster administrasjon ved behov. Axios/TanStack Query håndterer API og hurtigbuffer. CSS Modules/variabler organiserer temaer. localStorage lagrer tilstand, IndexedDB bildebytes. Node.js, Playwright og axe brukes til tester.

## 3. Lokal oppstart

Bruk Node.js støttet av Vite (Actions bruker Node 24). Ingen API-nøkler kreves.

```sh
npm ci
npm run dev
```

Åpne terminalens adresse. DummyJSON og eksterne bilder krever nettverk. Administrasjonslagring og bilde/backup/oppryddingsfunksjoner krever **HTTPS eller localhost og Web Locks**.

```sh
npm run lint
npm test
npm run build
npm run preview
npx playwright install chromium
npm run test:browser
```

`npm run format` skriver formateringsendringer. Se [teknisk dokumentasjon](docs/ADMINISTRATION.md) for produksjons- og Pages-tester.

## 4. Mappestruktur

- `src/api/` – API-forespørsler.
- `src/components/`, `src/pages/` – butikk og administrasjon.
- `src/context/`, `src/hooks/`, `src/utils/` – tilstand, lagring og validering.
- `src/config/`, `src/i18n/` – standarder og NO/EN-tekst.
- `src/assets/`, `Media/` – grafikk.
- `tests/` – enhets-, nettleser- og Pages-rutetester.
- `docs/ADMINISTRATION.md` – tekniske detaljer om lokal administrasjon.

## 5. Begrensninger og neste steg

Administrasjonen har ingen sikker autentisering eller backend. Endringer gjelder samme nettleserprofil/origin; andre apper på samme origin deler lagringsområdet. Ekte salg krever isolert origin, sikker backend, autentisering og forsvarlig kundedatabehandling.

Nettleserdata kan forsvinne; ta backup før viktig demoarbeid. Se [tekniske detaljer](docs/ADMINISTRATION.md) for API/lokal paginering, fanekonflikter, bilder, personvern, sikkerhetskopi og opprydding.

Produksjons-HTML har CSP og `no-referrer`. Pages bruker ikke `netlify.toml`; HTML CSP gir ikke innrammingsvern eller `nosniff`. Slike responsheadere krever en støttende vert/proxy.

Se [TODO](TODO.md) for siste relevante tester og gjenstående kontroller, og [valgfrie forbedringer](NICE_TO_HAVE.md). Lokale tester verifiserer ikke publisert versjon eller fullt WCAG-samsvar.
