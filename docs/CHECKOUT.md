# Kasse, fragt og Stripe

Kassen findes på `/kasse`, med adgang fra `/kurv`. Fragt og bestillinger administreres på `/admin/handel` med den eksisterende administratoradgang.

## Implementeret

- Dansk gæstecheckout med e-mail, navn, dansk adresse og valgfri telefon.
- Ordreoversigt med posestørrelser, antal, automatisk mængdepris, fragt og moms.
- Fragtpriser og en valgfri gratis-fragt-grænse gemmes i administrationen. Ingen fragtpris er opfundet eller aktiveret som standard. Grænsen gælder kaffeprisen efter mængderabat.
- Serveren afviser ukendte produkter, manipulerede prisfelter, ugyldige mængder og endnu ikke konfigurerede støttekøb. Beløb er heltal i øre. 25 % inkluderet moms beregnes pr. prislinje og fragt og gemmes med ordren.
- Ordren gemmer priser, poser/SKU'er, adresse, accepteret vilkårsversion og betalingsreferencer som et historisk øjebliksbillede.
- Stripe Checkout håndterer kortoplysningerne. Betalingsmetoder begrænses til kort og eventuelt MobilePay; tilgængeligheden afhænger også af Stripe-kontoen.
- Identiske betalingsforsøg bruger samme ordre og Stripe-idempotensnøgle. Ved netværksfejl kan samme forsøg genoptages. En ændret bestilling er et nyt forsøg. Sessionen udløber efter en time.
- Kun en signaturverificeret besked med korrekt ordre, session, beløb, valuta og driftstilstand kan markere ordren betalt. Retursiden kan ikke gøre det. Gentagne beskeder kan ikke skabe dobbelt omsætning.
- Ordresiden kræver den browsercookie, som startede købet. Kurven reduceres først efter verificeret betaling og bevarer efterfølgende tilføjelser.
- Refunderinger foretages i Stripe Dashboard. Webhooken afstemmer det aktuelle kumulative beløb. Forsinkede beskeder kan ikke sænke det registrerede beløb. En refundering før betalingsbeskeden returnerer en fejl, så Stripe kan prøve igen.
- Betalte ordrer og refunderinger opretter deduplikerede hændelser i en lokal outbox som grundlag for Saldi. Der sendes endnu intet til Saldi. Kreditnoter, refunderingers momsfordeling og regnskabsafstemning hører til Saldi-fasen.

## Testopsætning

Brug et testmiljø i din egen Stripe-konto. Hemmeligheder indtastes gennem et sikkert felt eller hostingplatformens miljøopsætning, aldrig i almindelig chat eller GitHub.

Den ignorerede `.env.local` skal indeholde `RISTET_CHECKOUT_MODE=test`, en matchende `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` fra det konkrete webhookendpoint og `NEXT_PUBLIC_SITE_URL`. Lokal adresse kan være `http://localhost:3000`. `STRIPE_MOBILEPAY_ENABLED` er som standard `false`.

Endpointet er `/api/stripe/webhook`. Abonnér på disse hændelser:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.expired
charge.refunded
```

En lokal server kræver Stripe CLI-videresendelse; Stripe kan ikke kontakte localhost fra internettet. CLI-videresendelsens signeringshemmelighed er forskellig fra en Dashboard-webhook. Genstart appen efter miljøændringer.

Log ind på `/admin`, åbn **Ordrer, fragt & betaling**, og tilføj en tydeligt navngivet testleveringsform. Brug fiktive kontaktoplysninger og officielle Stripe-testbetalingsoplysninger. Test betaling, afbrydelse, afvisning, gentagne/forsinkede webhooks og refundering. Kontrollér også, at en anden browser ikke kan læse ordren.

Automatiserede tests bruger isolerede database- og webhookfixtures. De gennemfører ingen transaktioner og dokumenterer ikke en rigtig sandboxbetaling. Der er endnu ikke gennemført en virkelig sandboxbetaling i udviklingssessionen.

`npm test` kører enhedstests. Efter `npm run build` kan `npm run test:checkout-http` kontrollere den rigtige server på port 3107 mod en isoleret, midlertidig database. Den test kontrollerer loginbeskyttelse, gemt fragt, serverberegnede priser, afvisning af ugyldige input, lukket betaling og forkastede webhooksignaturer. Testdatabasen slettes efter kontrollen, og den virkelige administratoradgang ændres ikke.

## MobilePay og API-version

Stripes officielle dokumentation blev kontrolleret 14. november 2026. MobilePay kan bruges til enkeltkøb i DKK for danske kunder, når kontoen er godkendt og aktiveret. Tilbagevendende MobilePay-betalinger understøttes ikke af Stripe. Abonnementer kræver en særskilt løsning, eksempelvis kort og Stripe Billing.

SDK'et er Stripe Node 23.1.0 med API-version `2026-10-28.endive`. Denne version bruger `allowed_payment_method_types` til at filtrere de dynamisk tilgængelige metoder. Match webhookendpointets API-version ved opsætning, og test ved opgraderinger.

Kilder: Stripes officielle dokumentation for MobilePay, Checkout fulfillment og webhooks samt den installerede officielle stripe-node-pakke.

## Før rigtigt salg

Betaling er lukket som standard. Testkøb sender ingen kaffe og tæller ikke i rigtig omsætning.

Før lancering mangler produktpublicering/lager, godkendte virksomheds- og kontaktoplysninger, handels- og privatlivsbetingelser, ordre-/kvitteringsmails, leveringsaftaler, offentlig HTTPS-drift og webhookovervågning. Momsbehandlingen skal bekræftes for virksomheden.

Live-tilstand kræver matchende live-nøgle, webhook, HTTPS, godkendte betingelser, en konkret `RISTET_TERMS_VERSION`, fragtvalg og publicerede produkter. De eksisterende produkter er fortsat kladder. Afkrydsning af betingelser i admin åbner ikke alene salget.

Fragtindstillinger booker ikke transport og vælger ikke konkrete pakkeshops. Brug kun leveringsformer, som kan ekspederes med den indsamlede adresse. Rabatkoder, kundekonti og abonnementer tilføjes separat; automatisk mængderabat er implementeret.

## Drift og data

Data bruger den eksisterende SQLite-database i `RISTET_DATA_DIR`. Løsningen kræver vedvarende disk og én appinstans. Flyt til PostgreSQL før flere instanser eller hosting uden vedvarende disk.

`npm run data:backup` sikkerhedskopierer de nye tabeller. Backup indeholder personoplysninger og skal beskyttes. Kundecookien udløber efter 30 dage; administratorens cookie efter højst otte timer. Private API-svar bruger `no-store`.

Produktionspolitik for oprydning af ubetalte forsøg/testdata, bevaring af regnskabsdata og kundernes rettigheder skal færdiggøres før salgsstart. Ordretabellen har endnu ingen automatisk oprydning. Kundeoplysninger, databaser og hemmeligheder holdes uden for GitHub.
