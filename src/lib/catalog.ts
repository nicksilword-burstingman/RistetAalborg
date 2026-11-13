import { z } from "zod";

export const productSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  country: z.string(),
  region: z.string().nullable(),
  process: z.string().nullable(),
  altitude: z.string().nullable(),
  roast: z.enum(["Lys", "Ikke fastlagt"]),
  methods: z.array(z.enum(["Espresso", "Filter"])),
  description: z.string(),
  color: z.enum(["rose", "lilac", "copper"]),
  label: z.object({
    src: z.string(),
    alt: z.string(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  status: z.literal("draft"),
  variants: z.array(
    z.object({
      sku: z.string(),
      grams: z.number().int().positive(),
      priceOre: z.number().int().nonnegative(),
    }),
  ),
});
export type Product = z.infer<typeof productSchema>;
export const products: Product[] = z.array(productSchema).parse([
  {
    id: "guatemala",
    slug: "guatemala-antigua",
    name: "Guatemala Antigua",
    country: "Guatemala",
    region: "Antigua",
    process: "Vasket",
    altitude: "1.500–1.800 m",
    roast: "Ikke fastlagt",
    methods: ["Espresso"],
    description:
      "En afbalanceret kaffe med fokus på espresso. Fra Antigua i Guatemala, dyrket i 1.500–1.800 meters højde og forarbejdet med den vaskede metode. Den endelige ristning og smagsbeskrivelse offentliggøres inden salgsstart.",
    color: "rose",
    label: {
      src: "/images/labels/guatemala-2026.webp",
      alt: "Ristet Aalborgs etiket til Guatemala Antigua",
      width: 1086,
      height: 1448,
    },
    status: "draft",
    variants: [
      { sku: "GUA-250", grams: 250, priceOre: 8000 },
      { sku: "GUA-1000", grams: 1000, priceOre: 26000 },
    ],
  },
  {
    id: "ethiopia",
    slug: "ethiopia-guji-shakisso",
    name: "Ethiopia Guji Shakisso",
    country: "Etiopien",
    region: "Guji, Shakisso",
    process: "Vasket",
    altitude: null,
    roast: "Lys",
    methods: ["Filter"],
    description:
      "En vasket kaffe fra Guji Shakisso i Etiopien. En lysere ristning med fokus på filterbrygning. Oplysninger om producent, højde og præcise smagsnoter tilføjes, når de er bekræftet.",
    color: "lilac",
    label: {
      src: "/images/labels/ethiopia-2026.webp",
      alt: "Ristet Aalborgs etiket til Etiopien",
      width: 1122,
      height: 1402,
    },
    status: "draft",
    variants: [
      { sku: "ETH-250", grams: 250, priceOre: 8000 },
      { sku: "ETH-1000", grams: 1000, priceOre: 26000 },
    ],
  },
  {
    id: "brazil",
    slug: "brazil-selection",
    name: "Brazil Selection",
    country: "Brasilien",
    region: null,
    process: null,
    altitude: null,
    roast: "Ikke fastlagt",
    methods: ["Espresso", "Filter"],
    description:
      "En alsidig kaffe fra Brasilien, udvalgt til både espresso og filter. Yderligere oplysninger om oprindelse, forarbejdning og ristning tilføjes inden salgsstart.",
    color: "copper",
    label: {
      src: "/images/labels/brazil-2026.webp",
      alt: "Ristet Aalborgs etiket til Brasilien",
      width: 1122,
      height: 1402,
    },
    status: "draft",
    variants: [
      { sku: "BRA-250", grams: 250, priceOre: 8000 },
      { sku: "BRA-1000", grams: 1000, priceOre: 26000 },
    ],
  },
]);
export const formatPrice = (ore: number) =>
  new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(ore / 100);
export type Filters = {
  origin: string;
  method: string;
  roast: string;
  maxPrice: number;
};
export function filterProducts(items: Product[], filters: Filters) {
  return items.filter(
    (p) =>
      (!filters.origin || p.country === filters.origin) &&
      (!filters.method || p.methods.some((m) => m === filters.method)) &&
      (!filters.roast || p.roast === filters.roast) &&
      p.variants[0].priceOre <= filters.maxPrice * 100,
  );
}
