# Ristet Aalborg

Owner-supplied work photographs now appear on `/om-os`. The header logo is larger on desktop and mobile. The homepage uses the supplied plantation reference unchanged, in place of the banana/coffee farm photograph. The requested identity-edit montage has not been generated because the built-in image tool is unavailable; no API fallback was used. Its caption must not imply an actual founder visit. Existing supplier/certification claims remain unverified.

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

The build is a standard Next.js server build, suitable for managed Next.js hosting or a Node server. Images are local and optimized with Next Image. No credentials are required for this phase.

## Editing in Phase 1

- Product drafts and variants: `src/lib/catalog.ts`. All money is integer øre; consumer prices include VAT. SKU identifiers belong to bag variants. All products intentionally remain drafts.
- Homepage: `src/app/page.tsx`. Brand colors, responsive styling and typography: `src/app/globals.css`.
- Brewing content: `src/lib/guides.ts`.
- Information drafts: `src/app/information/[slug]/page.tsx`.
- Original supplied assets: `public/images/logo.png` and `public/images/guatemala-label.png`.

Source edits are temporary. Nontechnical content management is Phase 2, not implemented or implied by this release. The original Guatemala label is displayed unchanged as supplied artwork; its printed tasting notes are not treated as verified catalog facts. The other labels and all bag representations are illustrative, not photographs of actual packaging.

## Deliberate release boundaries

This is **not ready to accept orders**. There is no backend, database, admin, authentication, cart persistence, payment, email subscription, image upload or Saldi connection. Account/cart routes explain availability rather than pretending to perform actions. The subscription selector changes a local preview only; 279 DKK is an example for 1 kg. Prices for other subscription weights remain unspecified.

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

Unsplash license: https://unsplash.com/license. Replace temporary photography with approved roastery/product/founder photography before launch. The logo currently occupies the founder photo position; no fictional founder portrait or name is used. Confirm the actual Instagram profile and newsletter provider before enabling those integrations.

## Support collection

The /stoet collection reuses existing products and SKUs. The displayed price adds 2,000 ore per bag for every weight, configured in src/lib/support.ts. Standard prices remain unchanged. The beneficiary and terms are pending and no funds are collected. Before sales, configure the confirmed beneficiary and campaign terms, persist a separate campaign reference and contribution per order line, and implement server-authoritative pricing and refund handling.
