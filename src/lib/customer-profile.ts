import { z } from "zod";
import { customerSchema } from "./checkout";
import { subscriptionListSchema } from "./subscriptions";
export const savedAddressSchema = customerSchema.omit({ email: true });
export const customerProfileSchema = z
  .object({
    address: savedAddressSchema.nullable(),
    subscriptions: subscriptionListSchema,
  })
  .strict();
export type CustomerProfile = z.infer<typeof customerProfileSchema>;
export const emptyCustomerProfile: CustomerProfile = {
  address: null,
  subscriptions: [],
};
