import { z } from "zod";

const imageSchema = z.object({
  src: z.string(),
  alt: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const bagSizes = [250, 500, 1000, 3000] as const;
export const bagPricesOre = [8000, 15000, 28000, 78000] as const;
export const MAX_BAGS = 99;

export const productSchema = z.object({
  id: z.string(),
  coffeeId: z.enum(["guatemala", "ethiopia", "brazil"]),
  slug: z.string(),
  name: z.string(),
  country: z.string(),
  region: z.string(),
  process: z.string(),
  altitude: z.string(),
  method: z.enum(["Espresso", "Filter"]),
  methods: z.array(z.enum(["Espresso", "Filter"])).length(1),
  roast: z.enum(["Lys", "Mellem", "Mørk"]),
  roastLevel: z.number().int().min(1).max(6),
  flavorNotes: z.array(z.string()).min(1),
  summary: z.string(),
  description: z.string(),
  color: z.enum(["rose", "lilac", "copper"]),
  label: imageSchema,
  image: imageSchema,
  status: z.literal("draft"),
  variants: z
    .array(
      z.object({
        sku: z.string(),
        grams: z.number().int().positive(),
        priceOre: z.number().int().nonnegative(),
      }),
    )
    .length(4),
});

export type Product = z.infer<typeof productSchema>;
export type CoffeeId = Product["coffeeId"];
export type BrewMethod = Product["method"];

const origins = {
  guatemala: {
    name: "Guatemala Antigua",
    country: "Guatemala",
    region: "Antigua",
    process: "Vasket",
    altitude: "1.500–1.800 m",
    color: "rose",
    label: {
      src: "/images/labels/guatemala-2026.webp",
      alt: "Ristet Aalborgs etiket til Guatemala Antigua",
      width: 1086,
      height: 1448,
    },
  },
  ethiopia: {
    name: "Etiopien Shakisso",
    country: "Etiopien",
    region: "Guji · Shakisso Farm",
    process: "Vasket",
    altitude: "1.900–2.300 m",
    color: "lilac",
    label: {
      src: "/images/labels/ethiopia-2026.webp",
      alt: "Ristet Aalborgs etiket til Etiopien Shakisso · Guji",
      width: 1122,
      height: 1402,
    },
  },
  brazil: {
    name: "Brasilien Bela Dutra",
    country: "Brasilien",
    region: "Minas Gerais · Araponga",
    process: "Natural",
    altitude: "1.000–1.300 m",
    color: "copper",
    label: {
      src: "/images/labels/brazil-2026.webp",
      alt: "Ristet Aalborgs etiket til Brasilien Bela Dutra · Araponga",
      width: 1122,
      height: 1402,
    },
  },
} as const;

type CoffeeEdition = {
  id: string;
  coffeeId: CoffeeId;
  slug: string;
  method: BrewMethod;
  roastLevel: number;
  flavorNotes: string[];
  summary: string;
  description: string;
};

const editions: CoffeeEdition[] = [
  {
    id: "guatemala",
    coffeeId: "guatemala",
    slug: "guatemala-antigua",
    method: "Espresso",
    roastLevel: 4,
    flavorNotes: ["Mørke bær", "Kanel", "Chokolade"],
    summary:
      "Rund og fyldig specialkaffe til espresso. Mørke bær, kanel og chokolade. Friskristet på bestilling i Aalborg.",
    description:
      "Fra Guatemalas vulkanske højland kommer denne skønne 100 % Arabica-specialkaffe, dyrket i 1.500–1.800 meters højde.\n\nVi har ristet bønnerne med fokus på en rund og fyldig espresso med smagsnoter af mørke bær, kanel og chokolade. En dejlig kombination af sødme, velbalanceret bitterhed og syre, der giver en harmonisk kaffeoplevelse – både som ren espresso og med mælk.\n\nFriskristet i Aalborg – fordi god specialkaffe skal være for alle.",
  },
  {
    id: "ethiopia",
    coffeeId: "ethiopia",
    slug: "ethiopia-guji-shakisso",
    method: "Filter",
    roastLevel: 2,
    flavorNotes: ["Søde bær", "Florale undertoner", "Cremet chokolade"],
    summary:
      "Frisk, frugtig og saftig specialkaffe til filter. Søde bær, florale noter og cremet chokolade. Friskristet i Aalborg.",
    description:
      "Direkte fra Guji-regionen i Etiopien kommer denne økologiske 100 % Arabica-specialkaffe, dyrket på Shakisso-farmen, hvor kaffe er mere end bare en afgrøde – det er en passion.\n\nHer får du en frisk, frugtig og saftig filterkaffe med smagsnoter af søde bær, florale undertoner og cremet chokolade. Den naturlige sødme og livlige syre giver en spændende og elegant kop, der virkelig viser, hvad specialkaffe kan.\n\nPerfekt til pour-over og filterbrygning – og til dig, der gerne vil udfordre smagsløgene lidt. Advarsel: Din almindelige morgenkaffe kan godt gå hen og blive lidt kedelig bagefter.\n\nØkologisk og friskristet i Aalborg – fordi god specialkaffe skal være for alle.",
  },
  {
    id: "brazil",
    coffeeId: "brazil",
    slug: "brazil-selection",
    method: "Espresso",
    roastLevel: 5,
    flavorNotes: ["Karamel", "Chokolade", "Ristede hasselnødder"],
    summary:
      "Blød og fyldig specialkaffe til espresso. Karamel, chokolade og ristede hasselnødder. Friskristet på bestilling i Aalborg.",
    description:
      "Fra Brasiliens frodige Minas Gerais-region kommer denne økologiske 100 % Arabica-specialkaffe, dyrket på den over 40 år gamle familiefarm Fazenda Bela Dutra, hvor kvalitet, bæredygtighed og ordentlige arbejdsforhold går hånd i hånd.\n\nVi har ristet bønnerne med fokus på en blød, cremet og fyldig espresso med lækre noter af karamel, chokolade og ristede hasselnødder. Her får du masser af naturlig sødme, behageligt lav bitterhed og en lang, dejlig eftersmag.\n\nEn fantastisk espresso alene, men også en lille chokoladebombe i cappuccino og latte. Kort sagt: Lidt som flydende dessert – bare med koffein og uden dårlig samvittighed.\n\nØkologisk og friskristet i Aalborg – fordi god specialkaffe skal være for alle.",
  },
  {
    id: "guatemala-filter",
    coffeeId: "guatemala",
    slug: "guatemala-antigua-filter",
    method: "Filter",
    roastLevel: 3,
    flavorNotes: ["Mælkechokolade", "Karamel", "Cremet mundfølelse"],
    summary:
      "Blød og elegant specialkaffe til filter. Mælkechokolade, karamel og en cremet mundfølelse. Friskristet i Aalborg.",
    description:
      "Fra Guatemalas vulkanske højland kommer denne skønne 100 % Arabica-specialkaffe, dyrket i 1.500–1.800 meters højde.\n\nVi har ristet bønnerne med kærlighed til den gode kop filterkaffe. Resultatet er en blød og elegant kaffe med lækre noter af mælkechokolade, karamel og en cremet mundfølelse. En dejlig afbalanceret kaffe, der gør det lidt nemmere at komme ud af sengen om morgenen.\n\nPerfekt til både pour-over, kaffemaskine og stempelkande – og selvfølgelig også til kop nummer to (vi dømmer ikke).\n\nFriskristet i Aalborg – fordi god specialkaffe skal være for alle.",
  },
  {
    id: "ethiopia-espresso",
    coffeeId: "ethiopia",
    slug: "ethiopia-guji-shakisso-espresso",
    method: "Espresso",
    roastLevel: 3,
    flavorNotes: ["Appelsin", "Mild syre", "Lav bitterhed"],
    summary:
      "Cremet og fyldig specialkaffe til espresso. Frisk appelsin, mild syre og lav bitterhed. Friskristet på bestilling i Aalborg.",
    description:
      "Fra kaffens fødeland, Etiopien, kommer denne økologiske 100 % Arabica-specialkaffe, dyrket i Guji-regionens frodige højland i 1.900–2.300 meters højde.\n\nHer dyrkes kaffe blandt skove og små lokale kaffefarme, hvor traditioner og godt håndværk går hånd i hånd. Vi har givet bønnerne vores eget præg i risteren og skabt en cremet og fyldig espresso med friske noter af appelsin, mild syre og dejligt lav bitterhed.\n\nEn espresso, der både smager fantastisk alene og med mælk – og som beviser, at espresso altså ikke behøver være bitter for at have karakter. Den må gerne bide lidt fra sig, bare ikke i tungen!\n\nØkologisk og friskristet i Aalborg – fordi god specialkaffe skal være for alle.",
  },
  {
    id: "brazil-filter",
    coffeeId: "brazil",
    slug: "brazil-bela-dutra-filter",
    method: "Filter",
    roastLevel: 5,
    flavorNotes: ["Nødder", "Modne bær", "Vanilje", "Mælkechokolade"],
    summary:
      "Blød og fyldig specialkaffe til filter. Nødder, modne bær, vanilje og mælkechokolade. Friskristet i Aalborg.",
    description:
      "Fra Brasiliens frodige Minas Gerais-region kommer denne økologiske 100 % Arabica-specialkaffe, dyrket på den over 40 år gamle familiefarm Fazenda Bela Dutra, hvor godt håndværk, bæredygtighed og ordentlige arbejdsforhold er i højsædet.\n\nVi har ristet bønnerne med fokus på en blød, cremet og fyldig filterkaffe med lækre noter af nødder, modne bær, vanilje og mælkechokolade. Den naturlige sødme og milde frugtighed giver en dejlig afbalanceret kop, som er svær ikke at holde af.\n\nPerfekt til kaffemaskine, pour-over og stempelkande. En vaskeægte hyggekaffe, der passer lige så godt til morgenbordet som til en eftermiddag, hvor én kop hurtigt bliver til tre.",
  },
];

export const products: Product[] = editions.map((edition) => {
  const methodKey = edition.method.toLowerCase();
  const prefix = `${edition.coffeeId.slice(0, 3).toUpperCase()}-${methodKey.toUpperCase()}`;
  return productSchema.parse({
    ...origins[edition.coffeeId],
    ...edition,
    methods: [edition.method],
    roast:
      edition.roastLevel <= 2
        ? "Lys"
        : edition.roastLevel >= 5
          ? "Mørk"
          : "Mellem",
    image: {
      src: `/images/products/${edition.coffeeId}-${methodKey}.webp`,
      alt: `${origins[edition.coffeeId].name}, ${methodKey}ristet specialkaffe fra Ristet Aalborg i kaffepose. Ristegrad ${edition.roastLevel} af 6.`,
      width: 1024,
      height: 1536,
    },
    status: "draft",
    variants: bagSizes.map((grams, index) => ({
      sku: `${prefix}-${grams}`,
      grams,
      priceOre: bagPricesOre[index],
    })),
  });
});

export const featuredProducts = products.slice(0, 3);

export const formatPrice = (ore: number) =>
  new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: Number.isInteger(ore / 100) ? 0 : 2,
  }).format(ore / 100);

export const formatWeight = (grams: number) =>
  grams >= 1000
    ? `${new Intl.NumberFormat("da-DK", { maximumFractionDigits: 2 }).format(grams / 1000)} kg`
    : `${grams} g`;

export type Filters = {
  origin: string;
  method: string;
  roast: string;
  maxPrice: number;
};

export function filterProducts(items: Product[], filters: Filters) {
  return items.filter(
    (product) =>
      (!filters.origin || product.country === filters.origin) &&
      (!filters.method || product.method === filters.method) &&
      (!filters.roast || product.roast === filters.roast) &&
      product.variants[0].priceOre <= filters.maxPrice * 100,
  );
}
