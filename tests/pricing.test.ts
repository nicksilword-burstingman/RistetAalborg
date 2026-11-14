import test from "node:test";
import assert from "node:assert/strict";
import { products, MAX_BAGS } from "../src/lib/catalog";
import { quoteCoffee, quoteSelection } from "../src/lib/pricing";
import {
  addCartItem,
  cartItemKey,
  parseCart,
  quoteCart,
  type CartItem,
} from "../src/lib/cart";

const product = products[0];
const item = (overrides: Partial<CartItem> = {}): CartItem => ({
  productId: product.id,
  grams: 500,
  quantity: 1,
  support: false,
  ...overrides,
});

test("quantity pricing gives the same total for identical coffee weight in different bag sizes", () => {
  assert.equal(quoteSelection(product, 500, 2).totalOre, 28000);
  assert.equal(quoteSelection(product, 250, 4).totalOre, 28000);
  assert.equal(quoteSelection(product, 1000, 3).totalOre, 78000);
  assert.equal(quoteSelection(product, 500, 6).totalOre, 78000);
  assert.equal(quoteSelection(product, 3000, 1).totalOre, 78000);
  assert.equal(quoteSelection(product, 500, 2).discountOre, 2000);
});

test("intermediate weights combine the published tiers without charging for unpurchased coffee", () => {
  for (const [grams, priceOre] of [
    [250, 8000],
    [500, 15000],
    [750, 23000],
    [1250, 36000],
    [1500, 43000],
    [2000, 56000],
    [3250, 86000],
  ])
    assert.equal(quoteCoffee(product, grams), priceOre);
  assert.equal(
    quoteSelection(product, 3000, MAX_BAGS).totalOre,
    78000 * MAX_BAGS,
  );
});

test("support remains 20 DKK per physical bag after quantity discounts", () => {
  const quote = quoteSelection(product, 500, 2, true);
  assert.equal(quote.coffeeOre, 28000);
  assert.equal(quote.supportOre, 4000);
  assert.equal(quote.totalOre, 32000);
  assert.equal(quoteSelection(product, 1000, 1, true).totalOre, 30000);
});

test("invalid sizes, fractions, negative values and excessive quantities are rejected", () => {
  for (const grams of [0, 100, -250, NaN, Infinity])
    assert.throws(() => quoteCoffee(product, grams));
  for (const quantity of [0, -1, 1.5, 100, NaN, Infinity])
    assert.throws(() => quoteSelection(product, 250, quantity));
  assert.throws(() => quoteSelection(product, 750, 1));
});

test("cart combines bag sizes for the same coffee and roast and reprices on edits", () => {
  const cart = [item({ grams: 250, quantity: 2 }), item()];
  const quote = quoteCart(cart);
  assert.equal(quote.groups.length, 1);
  assert.equal(quote.quantity, 3);
  assert.equal(quote.totalGrams, 1000);
  assert.equal(quote.totalOre, 28000);
  assert.equal(quote.discountOre, 3000);
  assert.equal(
    quoteCart([item({ grams: 250, quantity: 1 }), item()]).totalOre,
    23000,
  );
});

test("different coffees, roasts and support choices never share a quantity discount", () => {
  const quote = quoteCart([
    item(),
    item({ productId: "guatemala-filter" }),
    item({ productId: "ethiopia" }),
    item({ support: true }),
  ]);
  assert.equal(quote.groups.length, 4);
  assert.equal(quote.discountOre, 0);
  assert.equal(quote.totalOre, 62000);
});

test("stored carts accept only known products and recalculate prices from the catalog", () => {
  const parsed = parseCart([
    { ...item(), totalOre: 1, priceOre: 1 },
    item({ productId: "unknown" }),
  ]);
  assert.equal(parsed.length, 1);
  assert.equal(quoteCart(parsed).totalOre, 15000);
  assert.deepEqual(parseCart({ items: [item()] }), []);
  assert.deepEqual(parseCart([item({ quantity: -10 })]), []);
  assert.deepEqual(parseCart([item({ grams: 750 })]), []);
  const repeated = addCartItem([item()], item());
  assert.equal(repeated.length, 1);
  assert.equal(repeated[0].quantity, 2);
  assert.equal(cartItemKey(repeated[0]), cartItemKey(item()));
  assert.throws(() => addCartItem([item({ quantity: MAX_BAGS })], item()));
});
