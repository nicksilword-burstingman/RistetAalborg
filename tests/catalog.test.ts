import test from "node:test";
import assert from "node:assert/strict";
import { products, productSchema, filterProducts } from "../src/lib/catalog";
const defaults = { origin: "", method: "", roast: "", maxPrice: 100 };
test("filters combine origin, method, roast, and inclusive price ceiling", () => {
  assert.equal(
    filterProducts(products, {
      ...defaults,
      origin: "Etiopien",
      method: "Filter",
      roast: "Lys",
      maxPrice: 80,
    })[0]?.id,
    "ethiopia",
  );
  assert.equal(
    filterProducts(products, {
      ...defaults,
      origin: "Etiopien",
      method: "Espresso",
    }).length,
    1,
  );
  assert.equal(
    filterProducts(products, { ...defaults, maxPrice: 79 }).length,
    0,
  );
  assert.equal(
    filterProducts(products, { ...defaults, method: "Espresso" }).length,
    3,
  );
});
test("draft catalog has six distinct roasts, unique SKUs and four owner-approved bag prices", () => {
  assert.equal(products.length, 6);
  assert.equal(new Set(products.map((product) => product.slug)).size, 6);
  const skus = products.flatMap((p) => p.variants.map((v) => v.sku));
  assert.equal(new Set(skus).size, skus.length);
  for (const p of products) {
    assert.equal(p.status, "draft");
    assert.deepEqual(
      p.variants.map((v) => [v.grams, v.priceOre]),
      [
        [250, 8000],
        [500, 15000],
        [1000, 28000],
        [3000, 78000],
      ],
    );
  }
  assert.equal(
    productSchema.safeParse({
      ...products[0],
      variants: [{ sku: "invalid", grams: 250, priceOre: -1 }],
    }).success,
    false,
  );
});

test("all coffee facts and roast levels match the supplied descriptions and confirmed Ethiopian altitude", () => {
  const levels = {
    guatemala: 4,
    "guatemala-filter": 3,
    ethiopia: 2,
    "ethiopia-espresso": 3,
    brazil: 5,
    "brazil-filter": 5,
  };
  for (const product of products) {
    assert.equal(product.roastLevel, levels[product.id as keyof typeof levels]);
    assert.deepEqual(product.methods, [product.method]);
    assert(product.flavorNotes.length >= 3);
    for (const field of [
      product.region,
      product.altitude,
      product.process,
      product.description,
    ]) {
      assert(field.length > 0);
      assert(!field.includes("Afventer"));
    }
    assert.equal(
      product.image.src,
      `/images/products/${product.coffeeId}-${product.method.toLowerCase()}.webp`,
    );
    if (product.coffeeId === "ethiopia") {
      assert.equal(product.altitude, "1.900–2.300 m");
      assert(!product.description.includes("1.850"));
    }
  }
});
