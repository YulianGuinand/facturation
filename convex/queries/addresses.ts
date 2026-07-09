import { v } from "convex/values";
import { query } from "../_generated/server";

export const getAddressById = query({
  args: { addressId: v.id("addresses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.addressId);
  },
});
