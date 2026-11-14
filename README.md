# Ristet Aalborg

The storefront has a white page background, an editorial homepage with a video opening, and product illustrations that gently enlarge on hover, keyboard focus or touch press. `/om-os` includes the owner's personal story as an editable, database-backed timeline with seven owner-supplied photographs and label artwork. No stock or generated photographs are used in the timeline.

The homepage uses an editorial masthead, documentary cultivation/harvest imagery, a personal founder story and a prominent support section. Founder copy reflects the owner's description of studying medicine and wanting to help others. It makes no medical claims or claims about competitors. Documentary images are explicitly illustrative, not supplier evidence or Fairtrade certification. Sources, authors and reuse licenses are recorded in `public/images/ATTRIBUTION.md` and credited on the page. Replace illustrative images with documented supplier photography when available.

Danish storefront built with Next.js App Router, React, TypeScript, Tailwind CSS and Zod. Includes a responsive editorial homepage, accessible navigation, six draft coffee editions (three coffees, each for espresso and filter), brewing guides, subscription selections in the cart, customer profiles and clearly marked information drafts.

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
- Owner-supplied logo: `public/images/logo.png`. Standalone labels in `public/images/labels/` remain in the homepage cover and September story chapter. Product cards and detail pages use the supplied coffee bags in `public/images/products/`, with a transparent background, retained ground shadow, marked roast circles and espresso/filter checkbox. The unmarked `*-base.webp` assets are retained for future edits.

The timeline can be edited without source changes through `/admin`. Other content and product management still require Phase 2. Product descriptions, tasting notes, producer details and organic claims now come from the owner's supplied copy and artwork. Ethiopian altitude is 1,900–2,300 m in both editions, confirmed by the owner. The supplied bag artwork is a packaging visualization; no roast date or bag weight is invented on its blank fields.

## Produktsider og mængdepriser

Produktsiderne består af en farvet top med pose og produktvalg, beskrivelse og fakta, en oprindelsessektion med ejerleverede billeder og en sektion med andre kaffer. Espresso/filter har egne adresser, produkt-ID’er og SKU’er; de tre oprindelige produktadresser bevares. Alle produkter er fortsat kladder. Kun hele bønner kan vælges.

Poserne koster 80 kr. / 250 g, 150 kr. / 500 g, 280 kr. / 1 kg og 780 kr. / 3 kg. `src/lib/pricing.ts` beregner den laveste kombination af disse præcise vægttrin for den samlede vægt af samme kaffe og ristning. Fx koster 2 × 500 g 280 kr., 3 × 1 kg 780 kr. og 3 × 500 g 430 kr. Den fysiske pakning ændres ikke. Støtte på 20 kr. beregnes pr. faktisk pose efter kafferabatten; støtte- og almindelige køb grupperes hver for sig.

Kurven gemmer produkt-ID, posestørrelse, antal og støttevalg i browserens localStorage. Genindlæsning og ændringer i andre faner synkroniseres. Priser gemmes ikke i kurven; de genberegnes ud fra kataloget. Forskellige posestørrelser af samme kaffe og ristning får samlet mængdepris i kurven. Kurven kan tilpasses og tømmes, men har ingen ordre- eller betalingsfunktion. En fremtidig checkout skal validere de samme valg og genberegne alle priser og lagerstatus på serveren; browserens beløb må aldrig bruges direkte til betaling eller bogføring.

`src/lib/coffee-origins.ts` indeholder de tre oprindelseshistorier og billedbeskrivelser. Billedrækken kan sættes på pause, pauser ved fokus/hover og uden for viewporten og bliver en manuelt scrollende række ved reduceret bevægelse. `scripts/prepare-coffee-assets.mjs <attachment-directory>` kan genskabe de optimerede billeder fra de oprindelige ejerleverede vedhæftninger. Billederne ændres deterministisk med Sharp; der bruges ingen billedgenerering.

Hver kaffeudgave har egen kort metabeskrivelse, canonical, Open Graph/Twitter-billede og serverrenderet Product- og BreadcrumbList-JSON-LD. Ingen tilbud, lagerstatus eller bedømmelser opfindes. Sitemap medtager alle udgaver. Den eksisterende blokering af indeksering beholdes, indtil butikken og dens juridiske oplysninger er klar til offentlig lancering.

## Deliberate release boundaries

This is **not open for live orders**. Guest checkout includes contact/address fields, configurable Danish shipping, server-authoritative pricing and VAT snapshots, persistent orders, hosted Stripe Checkout, signature-verified payment/refund events and private order confirmations. `/admin/handel` provides shipping settings, payment readiness, orders, fulfillment and paid-order statistics separated from test purchases. Payment is disabled by default. A real Stripe sandbox transaction has not yet been performed. See [checkout setup](docs/CHECKOUT.md).

Product publication/stock administration, account email verification/password recovery, order email delivery, carrier labels/pickup points, recurring billing and Saldi remain unfinished. The coffees are drafts; live checkout rejects draft products. The existing owner login and timeline editor are preserved.

## Customer profiles and subscription selections

`/konto` supports real registration, login, logout, password changes, a saved Danish shipping address, saved subscription preferences and the customer's own linked orders. Better Auth manages hashed passwords and server-side sessions in separate tables in the existing SQLite database. Customer access never grants owner access. Guest orders are not attached by matching an unverified email address. New orders attach to the authenticated customer ID in the same database transaction as order creation.

The optional `BETTER_AUTH_URL` defaults to `NEXT_PUBLIC_SITE_URL`. With localhost configured, local loopback and private LAN addresses from this machine are accepted for local testing. A public deployment must set its actual HTTPS URL. Set `BETTER_AUTH_SECRET` to a random secret or keep the generated `customer-auth.secret` in the persistent data directory. Back it up together with the database and uploads; changing it invalidates customer sessions. No email provider is connected, so email verification, password recovery and email changes must be implemented before public account launch. Password changes currently require the existing password and revoke other sessions.

`/abonnement` supports espresso/filter/mixed, 250 g/500 g/1 kg, delivery every 2/4/6 weeks, the roaster's choice or a specific coffee, and quantity. Selections can be added, edited and removed in the cart, or saved to a profile. Provisional prices are 80/150/279 DKK per delivery and can be changed through the authenticated `/admin/handel` page. Prices are fetched from the server and remain separate from one-time quantity discounts. No active subscription or recurring charge is created. Checkout with subscription selections remains closed until recurring billing is implemented.

Run `npm run test:customer-http` and `npm run test:checkout-http` after `npm run build` for isolated HTTP checks against disposable databases. These checks do not send real payments or modify the owner's data. The existing SQLite storage is kept for this single-server installation; PostgreSQL remains a future migration before scaling to multiple application instances.

Search engine indexing is disabled through robots and metadata while draft products and legal content are public. Enable indexing only after publication rules, real business details and legal review are completed. Product Offer JSON-LD is intentionally deferred until real published offers exist; no invented inventory or purchasable offer is emitted.

## Next phases and architecture

1. **Phase 2:** PostgreSQL + Prisma, authenticated administration with server-side roles, product publication workflow, stock and price management, structured content editing, and signed cloud image uploads with validated MIME, file size and image decoding. Preview access must be separate from the public published catalog. Evaluate a maintained authentication library before implementation; never hardcode passwords.
2. **Phase 3:** Finish sandbox verification, product publication, stock reservation, order email, account verification/recovery and recurring billing. Customer profiles, guest checkout, server prices, addresses, configurable shipping, hosted Stripe sessions, deduplicated signed webhooks and cumulative refunds are implemented. Stripe MobilePay is optional for one-time purchases and must also be activated in the Stripe account; recurring MobilePay payments are not supported by Stripe. No card data enters the application.
3. **Phase 4:** Saldi is the confirmed accounting/ERP system. Before writing an adapter, inspect https://github.com/DANOSOFT/saldi at a recorded commit, its license, API authentication, REST, order/invoice/credit-note, inventory and webshop modules. This inspection is **not yet performed**, and no endpoint capability is assumed. Use a transactional outbox, retryable queue, idempotency keys, immutable accounting snapshots, provider payment/refund references and Saldi reference mappings. Add reconciliation and admin retry/history views. Do not modify Saldi core. Design customer and price models for CVR/B2B and inventory mappings.
4. **Phase 5:** integration/security tests, browser and accessibility checks, provider sandbox checkout/refund tests, Saldi reconciliation, backups, monitoring, production legal content and deployment. Set the real public URL; publish only approved products.

Keep commerce, payment and accounting separate. Never derive an accounting transaction from untrusted client totals. Preserve VAT allocations across line discounts and shipping, including refunds, rather than recomputing historical orders from current catalog data.

## Assets

The homepage uses an owner-supplied hand-picking photograph and a founder photograph browsing coffee beans, optimized as local WebP assets with EXIF removed. Its documentary opening film is under 10 seconds, muted and locally served. It respects reduced motion and data-saving preferences, supports pause/play and pauses offscreen. Source attribution, archive quality limits and reproducible export instructions are documented in [MEDIA.md](docs/MEDIA.md). The footage is illustrative and does not imply a supplier relationship or certification.

Original logo and Guatemala label supplied by the business. Temporary editorial photographs downloaded from Unsplash; stored locally with no third-party requests at page load:

- `coffee-hero.jpg`: https://images.unsplash.com/photo-1447933601403-0c6688de566e
- `coffee-moment.jpg`: https://images.unsplash.com/photo-1495474472287-4d71bcdd2085

Unsplash license: https://unsplash.com/license. Replace temporary editorial photography with approved roastery/product photography before launch. Founder and timeline photographs were supplied by the owner. Confirm the actual Instagram profile and newsletter provider before enabling those integrations.

## Support collection

The /stoet collection reuses existing products and SKUs. The displayed price adds 2,000 ore per bag for every weight, configured in src/lib/support.ts. Standard prices remain unchanged. The beneficiary and terms are pending and no funds are collected. Before sales, configure the confirmed beneficiary and campaign terms, persist a separate campaign reference and contribution per order line, and implement server-authoritative pricing and refund handling.
