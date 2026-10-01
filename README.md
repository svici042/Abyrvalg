# Abyrvalg

## 1. Appbeskrivelse

Abyrvalg er en responsiv nettbutikkdemo laget som skoleoppgave. DummyJSON er den opprinnelige produktkilden. Normalt bruker butikken API-paginering med `limit=12` og `skip`, samt API-søk, kategorifiltrering og sortering. Ved lagrede produktendringer brukes en eksplisitt lokal demomodus: hele katalogen lastes i en separat hurtigbuffer, lokale endringer brukes først, deretter filtrering, sortering og paginering. Dette gir riktige resultater også når en vare flyttes mellom sider eller kategorier. Innholdsendringer alene aktiverer ikke denne modusen. Du kan legge varer i handlekurven og gjennomføre en lokal demoordre. Det skjer ingen ekte betaling, lagerreservasjon eller levering. Bruk bare oppdiktede kundeopplysninger. Kurv, innstillinger og ordre lagres lokalt i nettleseren.

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

Kurv, innstillinger og demoordre finnes bare i samme nettleser. Det finnes ingen brukerautentisering, sikker server, enhetssynkronisering eller ekte betaling. Lagerdata er kun til demonstrasjon. Katalogforespørsler går til DummyJSON, og produktbilder lastes fra eksterne servere. Normalsøk bruker API-ets originaltekst. I lokal demomodus søker butikken også i lokale tekstendringer i valgt språk. Administrasjonen laster hele katalogen separat; produktdetaljer og handlekurv henter bare nødvendige enkeltprodukter. Nylig sett bruker lagrede øyeblikksbilder med gjeldende lokale endringer. Nye produkter fra katalogen trenger oversettelsesdata.

Prosjektet er en demo, ikke en butikk for ekte salg. Kommersiell bruk krever sikker backend, selgeropplysninger og vilkår for salg, levering, retur og personvern. Automatiske tester dokumenterer ikke full WCAG-samsvar. GitHub Pages-demoen er publisert og støtter direkte produktruter. Netlify-innstillingene i `netlify.toml` gjelder ikke på GitHub Pages; de faktiske Pages-svarene mangler egendefinerte sikkerhetsheadere.

## 6. Demoadministrasjon

- `/admin` – oversikt, eksport/import og nullstilling.
- `/admin/products` – søk og filtrer hele katalogen; rediger norsk/engelsk tekst, pris, kategori, merke, demolager, synlighet og bilder. Skjuling er reversibel, og hvert produkt kan gjenopprettes.
- `/admin/content` – butikknavn, logo, hovedbanner, kunngjøring, bunntekst og fiktiv kontaktinformasjon. Lagrede felt vises i butikken som ren tekst.
- `/admin/orders` og `/admin/orders/:id` – eksisterende administrasjon av lokale demoordrer, integrert i administrasjonsområdet.

Administrasjonen har ingen sikker autentisering. Endringer gjelder **bare denne nettleseren på samme origin**, og oppdaterer verken DummyJSON eller nettstedet for andre besøkende. Språk, valuta og tema deles med butikken. Skjemaene har eksplisitt Lagre/Avbryt og varsler ved navigasjon med ulagrede endringer. «Se i butikken» viser den lagrede versjonen.

Tekst og konfigurasjon lagres under `abyrvalg-admin` i localStorage med et versjonert skjema. Opplastede JPG/PNG/WebP/GIF-bilder (maksimalt 5 MB per bilde, 30 bilder per produkt) lagres som Blob i IndexedDB (`abyrvalg-images`); localStorage inneholder bare bildereferanser. SVG og andre filtyper avvises. Filhoder og dimensjoner kontrolleres før nettleseren dekoder bildene: maksimalt 4096 piksler per side og 16 millioner piksler. Godkjente stillbilder tegnes på canvas og kodes på nytt uten originalmetadata (JPEG som JPEG, andre som PNG). Den nye filen må også være under 5 MB. Nye animerte GIF/PNG/WebP-opplastinger og importer avvises uttrykkelig, slik at animasjonen ikke stille blir ødelagt; eksisterende lagrede animasjoner beholdes og kan eksporteres, men kan ikke importeres gjennom stillbildebehandlingen. Nye bildeadresser og importerte adresser må bruke HTTPS. Eldre HTTP-referanser beholdes i dataene, men vises ikke; et varsel ber om migrering til HTTPS eller opplasting før lagring/import. Eksterne adresser krever fortsatt nettverk og kan slutte å virke; en tilgjengelig reservevisning vises når bilder mangler. Lagringsfeil rapporteres, og en mislykket konfigurasjonslagring regnes ikke som lagret.

Prisene lagres alltid i USD. NOK-inndata konverteres med den eksisterende faste demokursen på 10,5 NOK per USD. Valutabytte alene endrer ikke den lagrede prisen. Handlekurven bruker gjeldende produktpriser, begrenser antall til lagerbeholdningen og fjerner skjulte eller utsolgte produkter med et synlig varsel. Kassen kontrollerer kurven igjen før ordreopprettelse. Allerede lagrede ordrer beholder historiske pris- og tekstøyeblikksbilder.

JSON-eksport inkluderer opplastede bildebytes, men ikke handlekurv, preferanser, ordrehistorikk eller kundeopplysninger. Import (maksimalt 50 MB) validerer skjema, verdier, språk og nødvendige bilder, og gir opplastede bilder nye ID-er før konfigurasjonen erstattes. Import og nullstilling krever bekreftelse. Nullstilling berører bare administrasjonsdata; den sletter ikke kurv, preferanser eller ordre. Kurvlinjer som fortsatt finnes, følger de gjenopprettede produktprisene og lagergrensene. Ubrukte opplastinger ryddes etter bildeendringer, avbrutte redigeringer, gjenoppretting, nullstilling og mislykkede importer. Bilder brukt av lagret konfigurasjon, eksport eller aktive utkast i andre faner er beskyttet. En mislykket import eller konfigurasjonslagring ruller tilbake nyimporterte bilder. «Rydd ubrukte opplastinger» gir eksplisitt opprydding med resultatmelding. Etter en lukket fane kan opplastinger ryddes ved neste redigering eller eksplisitte opprydding. Opprydding stoppes ved uleselige lagringsdata. Nettleseren kan også slette lokale data; eksporter en sikkerhetskopi før viktig demoarbeid.

Fokuserte administrasjonstester: `npm test` og `npx playwright test tests/browser/admin.spec.js`. Nettlesertestene dekker lagring/gjenoppretting, oppdatering etter refresh, bildehåndtering og eksport/import, kurv/kasse, tastatur, mobilvisning og automatisert tilgjengelighet i begge språk og temaer.

### Faner, konflikter og bildepersonvern

Lagring, import, nullstilling og bildesletting bruker samme Web Locks-lås. `storage`-hendelser oppdaterer lagrede innstillinger i andre faner. Hver lagring får en ny revisjon, og en utdatert lagring avvises også hvis lagringshendelsen ikke har kommet frem. Ulagrede utkast overskrives aldri automatisk: velg «Last inn lagrede data» eller «Behold utkastet mitt». Det siste krever bekreftelse og lar neste lagring erstatte den aktuelle delen (butikkinnhold eller valgt produkt), mens andre deler beholdes. Ved en ny endring oppstår en ny konflikt. Støtte for Web Locks og sikker kontekst (HTTPS eller localhost) kreves for administrasjonslagring og trygg bildeopprydding; butikken kan fortsatt leses uten dette.

Eksport estimerer UTF-8 JSON-overhead, MIME-prefikser og polstret Base64-størrelse for alle bildefiler **før** første Base64-streng opprettes. En løpende grense håndhever 50 MB, og eksport viser fremdrift. Import bruker samme 50 MB filgrense. Feil erstatter ikke eksisterende konfigurasjon. Nettleseren kan fortsatt gå tom for minne eller lagringsplass innenfor grensene.

Før import av eksterne bilder vises vertsnavnene i bekreftelsen, før noen av disse bildene lastes. Alle bildeelementer bruker `referrerPolicy="no-referrer"`. Eksterne bildeverter mottar likevel bildeforespørsler og IP-adressen din. HTTPS skjuler ikke disse opplysningene for verten. Canvas-behandling gjelder lokale opplastinger/importerte bildebytes; eksterne bildeadresser kan ikke renses lokalt. Demoen er ikke en grense mot ondsinnet kode eller manuell endring av nettleserlagring.

Butikkinnholdets tospråklige standardverdier deles av administrasjonen og butikken. Uendrede hovedbannerfelt lagres ikke som overstyringer, slik at opprinnelige linjeskift og utheving beholdes. Butikknavnet brukes i sidetitler, hjemlenkens tilgjengelige navn og synlig profil. Eksisterende ordrebehandling og kontrollene for å slette lokale ordre finnes fortsatt under `/admin/orders`.

Ekstra sikkerhetsregresjoner: `tests/admin-safety.test.js` og `tests/browser/admin-safety.spec.js` dekker fanekonflikter, beskyttede utkast, bildeopprydding, importrullering, tidlig eksportavvisning, API-paginering, profil, bildekontroll og eksternvertbekreftelse.
