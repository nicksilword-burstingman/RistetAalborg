# Ristet Aalborg

The storefront has a white page background, an editorial homepage with a video opening, and product illustrations that gently enlarge on hover, keyboard focus or touch press. `/om-os` includes the owner's personal story as an editable, database-backed timeline with seven owner-supplied photographs and label artwork. No stock or generated photographs are used in the timeline.

The homepage uses an editorial masthead, documentary cultivation/harvest imagery, a personal founder story and a prominent support section. Founder copy reflects the owner's description of studying medicine and wanting to help others. It makes no medical claims or claims about competitors. Documentary images are explicitly illustrative, not supplier evidence or Fairtrade certification. Sources, authors and reuse licenses are recorded in `public/images/ATTRIBUTION.md` and credited on the page. Replace illustrative images with documented supplier photography when available.

Phase 1: Danish storefront built with Next.js App Router, React, TypeScript, Tailwind CSS and Zod. Includes a responsive editorial homepage, accessible navigation, filterable catalog, three draft product pages, brewing guides, subscription configuration preview and clearly marked information drafts.

## Run locally

Requires Node.js 22. Use `npm ci`, then `npm run dev` and open http://localhost:3000. Copy `.env.example` to `.env.local` and set the canonical site URL when deploying.

```sh
npm test
npm run typecheck
npm run build
npm start
```

Requires Node.js **22.23.5 or later** with `node:sqlite` available (the SQLite module is still marked experimental in Node 22). The build is a standard Next.js Node server build. The public storefront needs no credentials. The timeline editor requires the separately generated administrator password. Uploaded images and the SQLite database require a writable, persistent data directory; this implementation must not run on ephemeral serverless storage or as several independent database replicas.

## Historie og administration

Åbn `/admin` for at redigere tidslinjen. Her kan ejeren tilføje, fjerne og flytte kapitler, redigere datoer og tekst samt uploade, udskifte, fjerne og sortere billeder. Hvert billede har egen billedbeskrivelse, billedtekst, beskæring og fokuspunkt. “Gem og offentliggør” gemmer historien i databasen og opdaterer `/om-os`. Ændringer gemmes ikke automatisk. Fremtidskapitlet vises altid efter de daterede milepæle.

Opret administratoradgangen én gang med `npm run admin:setup`. Den genererer en tilfældig kode og lægger den i `ADMIN-ADGANG.txt` i datamappen. Gem koden i en adgangskodeadministrator, og slet derefter tekstfilen. Adgangskoden ligger aldrig i kildekoden eller Git. Nulstil den om nødvendigt med `npm run admin:setup -- --reset`; det afslutter også eksisterende sessioner. Skripterne indlæser den lokale `.env.local`, hvis den findes.

Datamappen er som standard `.data/`. Sæt `RISTET_DATA_DIR` til en absolut, vedvarende placering for at bevare data på tværs af checkouts og deployment. Den lokale installation bruger `C:/Users/Bruger/RistetAalborg-data`, konfigureret i en ignoreret `.env.local`. Offentlig drift kræver HTTPS og korrekt `NEXT_PUBLIC_SITE_URL`, så administratorcookies bruger `Secure`.

- `content/timeline.json` og `public/images/timeline/` er de oprindelige 11 kapitler og syv billedfiler. De importeres kun, når databasen er tom; en ny kodeudgave overskriver ikke den redigerede historie.
- `src/lib/server/timeline-repository.ts` indeholder datalaget og `TimelineRepository`-grænsefladen. Databasetabellerne holder kapitler, billeder og rækkefølge adskilt. En senere PostgreSQL-adapter kan bruge samme visningsdata.
- Offentlig tekst serverrenderes. Animationen bruger `requestAnimationFrame`, passive scrolllyttere og en `ResizeObserver`; indholdet forbliver læseligt uden JavaScript og ved reduceret bevægelse.
- Billeder får faste proportioner og lazy loading med Next Image. Upload accepterer kun decodede JPG-, PNG- og WebP-filer på højst 10 MB og 40 millioner pixels, genkoder dem til WebP, fjerner EXIF og bruger tilfældige filnavne. Uploads ligger uden for `public/` og leveres via `/media/[id]`.
- Alle ændringsendpoints kontrollerer server-side ejersession og samme origin. Login er begrænset til 10 forsøg pr. 15 minutter samlet for denne enkeltbrugerinstallation. Sessioner gemmes som tokenhash, udløber efter otte timer og kan tilbagekaldes. Adgangskoder hashes med scrypt. Samtidig redigering beskyttes med revisionskontrol og database-transaktioner.

Brug “Eksportér historien” til en JSON-kopi af teksten og billedreferencerne. Brug `npm run data:backup` til en samlet sikkerhedskopi af SQLite, uploadede billeder og kodehash; aktive sessioner medtages ikke. Flyt kopien fra datamappens `backups/` til en anden disk eller backupplacering. En gendannelse kræver, at serveren stoppes, og at `ristet.sqlite`, `uploads/` og eventuelt `admin-password.hash` sættes tilbage samlet. Seed-billederne følger koden i Git. Fjernede billeder forsvinder fra tidslinjen ved gemning; uploadede originalreferencer beholdes i medielageret og backups, indtil de ryddes særskilt.

## Editing in Phase 1

- Product drafts and variants: `src/lib/catalog.ts`. All money is integer øre; consumer prices include VAT. SKU identifiers belong to bag variants. All products intentionally remain drafts.
- Homepage: `src/app/page.tsx`. Brand colors, responsive styling and typography: `src/app/globals.css`.
- Brewing content: `src/lib/guides.ts`.
- Information drafts: `src/app/information/[slug]/page.tsx`.
- Original supplied assets: `public/images/logo.png` and `public/images/guatemala-label.png`.

The timeline can be edited without source changes through `/admin`. Other content and product management still require Phase 2. The original Guatemala label is displayed as supplied artwork; its printed tasting notes are not treated as verified catalog facts. The other labels and all bag representations are illustrative, not photographs of actual packaging.

## Deliberate release boundaries

This is **not ready to accept orders**. The backend currently covers only timeline storage, an owner login, image uploads and story editing. There is no product/order administration, customer authentication, cart persistence, payment, email subscription or Saldi connection. Account/cart routes explain availability rather than pretending to perform actions. The subscription selector changes a local preview only; 279 DKK is an example for 1 kg. Prices for other subscription weights remain unspecified.

Search engine indexing is disabled through robots and metadata while draft products and legal content are public. Enable indexing only after publication rules, real business details and legal review are completed. Product Offer JSON-LD is intentionally deferred until real published offers exist; no invented inventory or purchasable offer is emitted.

## Next phases and architecture

1. **Phase 2:** PostgreSQL + Prisma, authenticated administration with server-side roles, product publication workflow, stock and price management, structured content editing, and signed cloud image uploads with validated MIME, file size and image decoding. Preview access must be separate from the public published catalog. Evaluate a maintained authentication library before implementation; never hardcode passwords.
2. **Phase 3:** server-authoritative cart pricing and stock checks; guest/account checkout; addresses; hosted Stripe Checkout and recurring billing. Verify current Danish Stripe/MobilePay support and recurring-payment restrictions against provider documentation before choosing payment methods. Only verified provider webhooks may mark an order paid. Persist deduplicated webhook events and reconcile refunds. No card data enters the application.
3. **Phase 4:** Saldi is the confirmed accounting/ERP system. Before writing an adapter, inspect https://github.com/DANOSOFT/saldi at a recorded commit, its license, API authentication, REST, order/invoice/credit-note, inventory and webshop modules. This inspection is **not yet performed**, and no endpoint capability is assumed. Use a transactional outbox, retryable queue, idempotency keys, immutable accounting snapshots, provider payment/refund references and Saldi reference mappings. Add reconciliation and admin retry/history views. Do not modify Saldi core. Design customer and price models for CVR/B2B and inventory mappings.
4. **Phase 5:** integration/security tests, browser and accessibility checks, provider sandbox checkout/refund tests, Saldi reconciliation, backups, monitoring, production legal content and deployment. Set the real public URL; publish only approved products.

Keep commerce, payment and accounting separate. Never derive an accounting transaction from untrusted client totals. Preserve VAT allocations across line discounts and shipping, including refunds, rather than recomputing historical orders from current catalog data.

## Assets

Original logo and Guatemala label supplied by the business. Temporary editorial photographs downloaded from Unsplash; stored locally with no third-party requests at page load:

- `coffee-hero.jpg`: https://images.unsplash.com/photo-1447933601403-0c6688de566e
- `coffee-moment.jpg`: https://images.unsplash.com/photo-1495474472287-4d71bcdd2085

Unsplash license: https://unsplash.com/license. Replace temporary editorial photography with approved roastery/product photography before launch. Founder and timeline photographs were supplied by the owner. Confirm the actual Instagram profile and newsletter provider before enabling those integrations.

## Support collection

The /stoet collection reuses existing products and SKUs. The displayed price adds 2,000 ore per bag for every weight, configured in src/lib/support.ts. Standard prices remain unchanged. The beneficiary and terms are pending and no funds are collected. Before sales, configure the confirmed beneficiary and campaign terms, persist a separate campaign reference and contribution per order line, and implement server-authoritative pricing and refund handling.
