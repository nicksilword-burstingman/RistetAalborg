// Shared across products and sizes; catalog prices remain unchanged.
export const supportCampaign = {
  title: "Kaffe med omtanke",
  contributionOre: 2000,
  beneficiary: null as string | null,
  status: "draft" as const,
};
export function supportPrice(basePriceOre: number) {
  return basePriceOre + supportCampaign.contributionOre;
}
