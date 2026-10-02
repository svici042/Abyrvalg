# Abyrvalg

## 1. Appbeskrivelse

Abyrvalg er en responsiv nettbutikkdemo laget som skoleoppgave, med DummyJSON som produktkilde. Du kan søke, filtrere og sortere produkter, bruke handlekurven og gjennomføre en lokal demoordre. Ingen ekte betaling, lagerreservasjon eller levering skjer. Bruk bare oppdiktede kundeopplysninger.

Språk (norsk/engelsk), valuta (NOK/USD) og lyst/mørkt tema velges separat. Kurv, preferanser, nylig sette produkter, demoordre og administrasjonsendringer lagres i nettleseren. Prisene lagres i USD; NOK bruker demokursen 10,5 NOK per USD.

Demo: [GitHub Pages](https://svici042.github.io/Abyrvalg/) · Kildekode: [GitHub](https://github.com/svici042/Abyrvalg).

Beskrivelsen gjelder den lokale implementasjonen. Demoen er tidligere publisert, men siste administrasjon og fanesynkronisering er ikke verifisert på den publiserte versjonen. Tidligere deploykontroller gjelder en tidligere versjon.

### Sider og administrasjon

Rutene er relative til nettstedets baseadresse (`/Abyrvalg/` på GitHub Pages).

| Rute                                 | Funksjon                                                                           |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| `/`                                  | Katalog med søk, kategori, sortering og paginering                                 |
| `/products/:id`                      | Produktdetaljer og bildegalleri                                                    |
| `/cart`, `/checkout`, `/orders/:id`  | Kurv, demokasse og ordrebekreftelse                                                |
| `/admin`                             | Oversikt, eksport/import, nullstilling og bildeopprydding                          |
| `/admin/products`                    | Søk og filtrering i hele katalogen; redigering av eksisterende produkter           |
| `/admin/content`                     | Butikknavn, logo, hovedbanner, kunngjøring, bunntekst og fiktiv kontaktinformasjon |
| `/admin/orders`, `/admin/orders/:id` | Lokale ordre, detaljer, statusendringer og sletting                                |

Produkter kan få norsk/engelsk tekst, pris, kategori, merke, demolager, synlighet og bilder. Bilder kan flyttes, fjernes og velges som hovedbilde. Skjuling er reversibel; enkeltprodukter kan gjenopprettes til API-data. Butikkinnhold vises som ren tekst; uendrede bannerfelt beholder standardens linjeskift og utheving.

Skjemaene bruker Lagre/Avbryt og varsler ved navigasjon med ulagrede endringer. «Se i butikken» viser lagret versjon. Nullstilling krever bekreftelse og fjerner bare administrasjonsendringer, ikke kurv, preferanser eller ordre. Ordresidene har egne slettekontroller.

### API-paginering og lokal demomodus

Normalt brukes API-søk, kategorifiltrering og sortering med `limit=12` og `skip`. Søket bruker API-ets originaltekst. Når minst én produktoverstyring er lagret, lastes hele katalogen i en separat hurtigbuffer: lokale endringer brukes før skjuling, søk, filtrering, sortering og paginering. Søket inkluderer da lokale tekstendringer i valgt språk. Innholdsendringer alene aktiverer ikke denne modusen.

Administrasjonen laster hele katalogen. Produktdetaljer og kurv henter nødvendige enkeltprodukter. Nylig sett bruker lagrede øyeblikksbilder med gjeldende overstyringer. Kurven oppdaterer pris, begrenser antall til lager og fjerner skjulte eller utilgjengelige varer med varsel. Kassen kontrollerer nyeste kurv før og etter simulert behandling og avviser en ordre hvis det gjennomgåtte pristilbudet er endret. Regresjonstester dekker pris, lager og skjuling fra en annen fane under behandlingen. Lagrede ordre beholder historiske pris- og tekstøyeblikksbilder.

## 2. Teknologivalg og grunner

- React og Vite gir komponentbasert grensesnitt og rask lokal utvikling.
- React Router håndterer sider, URL-filtre og nettleserhistorikk. Administrasjonsrutene lastes ved behov i separate JavaScript-pakker.
- Axios og TanStack Query håndterer API-forespørsler og hurtigbuffer.
- CSS Modules og CSS-variabler organiserer stiler og temaer.
- localStorage lagrer tekst og tilstand; IndexedDB lagrer opplastede bildebytes.
- Node.js, Playwright og axe brukes til enhets-, nettleser- og automatiserte tilgjengelighetstester.

## 3. Lokal oppstart

Bruk en Node.js-versjon som støttes av prosjektets Vite-versjon:

```sh
npm ci
npm run dev
```

Åpne adressen i terminalen. Ingen API-nøkler kreves; DummyJSON og eksterne bilder krever nettverk. Administrasjonslagring, opplasting, eksport/import og trygg opprydding krever **HTTPS eller localhost og Web Locks-støtte**. Butikken kan fortsatt leses uten Web Locks.

Kommandoer fra `package.json`:

```sh
npm run lint
npm test
npm run build
npm run preview
npx playwright install chromium
npm run test:browser
```

`npm run format` formaterer kildekode, tester og dokumenter og skriver endringene til disk. For nettlesertester mot produksjonsbygg, bygg først og kjør deretter i PowerShell:

```powershell
$env:PLAYWRIGHT_PREVIEW='1'
npm run test:browser
```

Fokusert administrasjonstest: `npx playwright test tests/browser/admin.spec.js tests/browser/admin-safety.spec.js`. Playwright bruker Chromium. Live-testene bruker DummyJSON; øvrige nettlesertester bruker isolerte testdata. Mobilvisninger i tester erstatter ikke fysisk telefon.

## 4. Mappestruktur

- `src/api/` – produkt- og kategoriforespørsler.
- `src/components/`, `src/pages/` – butikk- og administrasjonsgrensesnitt.
- `src/context/`, `src/hooks/`, `src/utils/` – tilstand, lagring, validering og beregninger.
- `src/config/`, `src/i18n/` – butikkstandarder, valuta og oversettelser.
- `src/assets/`, `Media/` – grafiske ressurser.
- `tests/` – enhets- og nettlesertester, inkludert lokal Pages-rutegjenoppretting.

## 5. Begrensninger og neste steg

### Lokal lagring og fanekonflikter

Administrasjonen har ingen sikker autentisering. Endringer gjelder bare samme nettleserprofil og origin, og endrer verken DummyJSON eller butikken for andre besøkende. Det finnes ingen sikker backend eller enhetssynkronisering. Nettleseren kan slette lokale data; ta sikkerhetskopi før viktig demoarbeid.

Administrasjonen bruker et versjonert skjema under `abyrvalg-admin` i localStorage. `storage`-hendelser synkroniserer denne konfigurasjonen mellom faner; dette er ikke generell fanesynkronisering av kurv, preferanser og ordre. Lagring, import, nullstilling og bildeopprydding bruker samme Web Locks-lås. Nye revisjoner og kontroll av lagret verdi avviser utdaterte lagringer også før en lagringshendelse er mottatt.

Ulagrede utkast overskrives ikke automatisk. Ved konflikt kan du laste inn lagrede data eller bekrefte «Behold utkastet mitt». Neste lagring erstatter da valgt produkt eller butikkinnhold i nyeste konfigurasjon, mens andre deler beholdes. En ny ekstern endring gir en ny konflikt. Lagringsfeil rapporteres og regnes ikke som vellykket lagring.

### Bilder og personvern

- Lokale stillbilder: JPG/JPEG, PNG, WebP og GIF. SVG og andre filtyper avvises.
- Maksimalt 5 MB per bilde, 4096 piksler per side og 16 millioner piksler totalt. Produktgalleriet tillater opptil 30 bilder; logoen er ett bilde.
- Filhoder og dimensjoner kontrolleres før dekoding. Canvas koder JPEG som JPEG og øvrige formater som PNG uten originalmetadata; resultatet må også være innenfor 5 MB.
- Nye animerte GIF/PNG/WebP-opplastinger avvises. Eksisterende animasjoner kan eksporteres og importeres fra en sikkerhetskopi med egen bekreftelse. Originale bildebytes og metadata beholdes for å bevare animasjonen; bruk bare sikkerhetskopier du stoler på. Avslag avbryter importen og bevarer tidligere innstillinger. Samme fil- og dimensjonsgrenser gjelder, med maksimalt 300 rammer og 64 millioner rammepiksler per animasjon.
- Opplastinger lagres som Blob i IndexedDB (`abyrvalg-images`), med referanser i konfigurasjonen. Manglende bilder får reservevisning.

Nye og importerte eksterne bildeadresser må bruke HTTPS. Eldre HTTP-referanser beholdes i dataene, men blokkeres fra visning og må erstattes før lagring/import. Eksterne bilder behandles ikke med canvas og har ikke de lokale filgrensene eller metadatafjerningen. De krever nettverk og kan slutte å virke.

Før import viser bekreftelsen eksterne bildeverter før bildene lastes. Bildeelementer bruker `referrerPolicy="no-referrer"`, men vertene mottar fortsatt bildeforespørsler og IP-adresse. HTTPS skjuler ikke dette for bildeverten. Demoen beskytter ikke mot ondsinnet kode eller manuell endring av nettleserlagring.

### Sikkerhetskopi og opprydding

JSON-eksport inkluderer administrasjonskonfigurasjon og opplastede bildebytes, ikke kurv, preferanser, ordrehistorikk eller kundeopplysninger. Eksterne bilder eksporteres som adresser. Eksport beregner UTF-8 JSON-overhead, MIME-prefikser og polstret Base64-størrelse før første Base64-streng opprettes, og håndhever en løpende 50 MB-grense med fremdriftsmelding. Manglende opplastinger stopper eksporten.

Import har samme 50 MB filgrense, krever bekreftelse og validerer skjema, verdier, språk og nødvendige bildebytes. Bilder behandles sekvensielt og får nye ID-er før konfigurasjonen erstattes. Feil før lagring bevarer eksisterende konfigurasjon og forsøker å rulle tilbake nye bilder. Hvis opprydding feiler etter en lagret import/nullstilling, opplyser meldingen at konfigurasjonen er lagret og at opprydding må prøves igjen. Nettleseren kan gå tom for minne eller lagringsplass innenfor grensene.

Ubrukte opplastinger ryddes ved bildeendringer, avbrutte redigeringer, gjenoppretting, nullstilling og mislykkede importer. Lagrede bilder, eksportbilder og aktive utkast i andre faner beskyttes, også i suspenderte faner. Etter at en fane lukkes, kan ubrukte bilder ryddes ved neste redigering eller med «Rydd ubrukte opplastinger». Gamle `abyrvalg-draft:*`-økternøkler valideres og fjernes bare når ingen aktiv eller ventende livstidslås finnes. Nye faner og andre lagringsnøkler beholdes. Uleselige lagringsdata stopper oppryddingen før bilder slettes.

### Verifikasjon og videre bruk

Tester finnes for administrasjon, fanekonflikter, bilder, feil og kurv/kasse. Testkode er ikke i seg selv dokumentasjon på vellykket kjøring. Se `TODO.md` for faktisk verifikasjon og gjenstående manuelle kontroller; automatiserte tilgjengelighetstester dokumenterer ikke fullt WCAG-samsvar.

GitHub Pages bruker ikke sikkerhetsheaderne i `netlify.toml`; historiske deploy- og Snyk-resultater verifiserer ikke siste versjon. Ved eventuell Netlify-migrering må ruter og faktiske headere kontrolleres der. Ekte salg krever sikker backend, autentisering, betaling, ordrebehandling og juridisk informasjon. Nye eller endrede API-produkter kan trenge oppdaterte oversettelser. Valgfrie demoideer står i `NICE_TO_HAVE.md`.
