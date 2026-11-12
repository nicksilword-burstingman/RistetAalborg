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
    0,
  );
  assert.equal(
    filterProducts(products, { ...defaults, maxPrice: 79 }).length,
    0,
  );
  assert.equal(
    filterProducts(products, { ...defaults, method: "Espresso" }).length,
    2,
  );
});
test("draft catalog uses unique SKUs and integer øre for both bag sizes", () => {
  const skus = products.flatMap((p) => p.variants.map((v) => v.sku));
  assert.equal(new Set(skus).size, skus.length);
  for (const p of products) {
    assert.equal(p.status, "draft");
    assert.deepEqual(
      p.variants.map((v) => [v.grams, v.priceOre]),
      [
        [250, 8000],
        [1000, 26000],
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
