# Abyrvalg

## 1. Appbeskrivelse

Abyrvalg er en responsiv nettbutikkdemo laget som skoleoppgave. Produktkatalog, søk og kategorier bruker DummyJSON. Du kan legge varer i handlekurven og gjennomføre en lokal demoordre. Det skjer ingen ekte betaling, lagerreservasjon eller levering. Bruk bare oppdiktede kundeopplysninger. Kurv, innstillinger og ordre lagres lokalt i nettleseren.

Grensesnittet finnes på norsk og engelsk, og valuta kan velges separat (NOK eller USD). Tema kan byttes mellom lyst og mørkt. Produktdata og bilder hentes fra eksterne tjenester, så prosjektet trenger nettverk for produktvisning.

Demo: [Abyrvalg på GitHub Pages](https://svici042.github.io/Abyrvalg/) · Kildekode: [GitHub-repositoriet](https://github.com/svici042/Abyrvalg).

## 2. Teknologivalg og grunner

- React og Vite gir et komponentbasert grensesnitt og rask lokal utvikling.
- React Router håndterer sider, URL-filtre og nettleserhistorikk.
- Axios og TanStack Query håndterer API-forespørsler og hurtigbuffer.
- CSS Modules holder stilene lokale for komponentene, mens CSS-variabler støtter temaene.
- Node.js, Playwright og axe brukes til enhets-, nettleser- og automatiserte tilgjengelighetstester.

## 3. Lokal oppstart

Bruk en Node.js-versjon som støttes av Vite (22.12 eller nyere, eller 24 eller nyere).

```sh
npm ci
npm run dev
```

Åpne adressen som vises i terminalen. Ingen API-nøkler kreves; DummyJSON og produktbilder krever nettverk.

```sh
npm run format
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

For nettlesertester mot et lokalt produksjonsbygg: Kjør `$env:PLAYWRIGHT_PREVIEW='1'; npm run test:browser` i PowerShell. Live-testen bruker DummyJSON; de andre nettlesertestene bruker isolerte testdata.

## 4. Mappestruktur

- `src/api/` – forespørsler om produkter og kategorier.
- `src/components/` – felles grensesnittkomponenter.
- `src/pages/` – katalog, produktdetaljer, handlekurv, kasse og ordre.
- `src/context/`, `src/hooks/`, `src/utils/` – tilstand, preferanser og beregninger.
- `src/i18n/` – grensesnitttekster og produktoversettelser.
- `src/assets/` og `Media/` – grafiske ressurser.
- `tests/` – enhets- og nettlesertester.

## 5. Begrensninger og neste steg

Kurv, innstillinger og demoordre finnes bare i samme nettleser. Det finnes ingen brukerautentisering, sikker server, enhetssynkronisering eller ekte betaling. Lagerdata er kun til demonstrasjon. Katalogforespørsler går til DummyJSON, og produktbilder lastes fra eksterne servere. Søk bruker engelske produkttekster. Nye produkter fra katalogen trenger oversettelsesdata.

Prosjektet er en demo, ikke en butikk for ekte salg. Kommersiell bruk krever sikker backend, selgeropplysninger og vilkår for salg, levering, retur og personvern. Automatiske tester dokumenterer ikke full WCAG-samsvar. GitHub Pages-demoen er publisert og støtter direkte produktruter. Netlify-innstillingene i `netlify.toml` gjelder ikke på GitHub Pages; de faktiske Pages-svarene mangler egendefinerte sikkerhetsheadere.
