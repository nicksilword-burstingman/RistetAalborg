import type { Metadata } from "next";
import type { Product } from "./catalog";

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function productMetadata(product: Product, support = false): Metadata {
  const path = `/${support ? "stoet" : "shop"}/${product.slug}`;
  const title = `${product.name} ${product.method.toLowerCase()}${support ? " med støtte" : ""} – friskristet specialkaffe`;
  return {
    title,
    description: product.summary,
    alternates: { canonical: path },
    keywords: [
      "specialkaffe",
      "friskristet kaffe",
      "kafferisteri Aalborg",
      product.name,
      `${product.method.toLowerCase()}kaffe`,
      "hele bønner",
    ],
    openGraph: {
      title,
      description: product.summary,
      url: path,
      locale: "da_DK",
      type: "website",
      images: [
        {
          url: product.image.src,
          width: product.image.width,
          height: product.image.height,
          alt: product.image.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: product.summary,
      images: [product.image.src],
    },
  };
}

export function productStructuredData(product: Product, support = false) {
  const base = siteUrl();
  const collection = support ? "stoet" : "shop";
  const url = `${base}/${collection}/${product.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${url}#product`,
        name: `${product.name} · ${product.method}`,
        description: product.summary,
        image: `${base}${product.image.src}`,
        url,
        brand: { "@type": "Brand", name: "Ristet Aalborg" },
        category: `Specialkaffe · ${product.method} · Hele bønner`,
        countryOfOrigin: { "@type": "Country", name: product.country },
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "Ristegrad",
            value: `${product.roastLevel}/6`,
          },
          {
            "@type": "PropertyValue",
            name: "Væksthøjde",
            value: product.altitude,
          },
          { "@type": "PropertyValue", name: "Proces", value: product.process },
          {
            "@type": "PropertyValue",
            name: "Smagsnoter",
            value: product.flavorNotes.join(", "),
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Forside", item: base },
          {
            "@type": "ListItem",
            position: 2,
            name: support ? "Støt" : "Shop",
            item: `${base}/${collection}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${product.name} · ${product.method}`,
            item: url,
          },
        ],
      },
    ],
  };
}
