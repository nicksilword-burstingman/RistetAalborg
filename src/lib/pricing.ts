import { bagSizes, MAX_BAGS, type Product } from "./catalog";
import { supportCampaign } from "./support";

export function quoteCoffee(product: Product, totalGrams: number) {
  if (
    !Number.isSafeInteger(totalGrams) ||
    totalGrams < 250 ||
    totalGrams % 250 !== 0 ||
    totalGrams > 3000 * MAX_BAGS * bagSizes.length
  ) {
    throw new RangeError("Vægten skal være et gyldigt antal hele poser.");
  }
  const units = totalGrams / 250;
  const prices = Array<number>(units + 1).fill(Infinity);
  prices[0] = 0;
  for (let unit = 1; unit <= units; unit++) {
    for (const variant of product.variants) {
      const size = variant.grams / 250;
      if (size <= unit)
        prices[unit] = Math.min(
          prices[unit],
          prices[unit - size] + variant.priceOre,
        );
    }
  }
  return prices[units];
}

export function quoteSelection(
  product: Product,
  grams: number,
  quantity: number,
  support = false,
) {
  const variant = product.variants.find((item) => item.grams === grams);
  if (
    !variant ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > MAX_BAGS
  )
    throw new RangeError(
      "Vælg en gyldig posestørrelse og et antal mellem 1 og 99.",
    );
  const totalGrams = grams * quantity;
  const coffeeOre = quoteCoffee(product, totalGrams);
  const regularOre = variant.priceOre * quantity;
  const supportOre = support ? supportCampaign.contributionOre * quantity : 0;
  return {
    totalGrams,
    coffeeOre,
    supportOre,
    discountOre: regularOre - coffeeOre,
    totalOre: coffeeOre + supportOre,
  };
}
