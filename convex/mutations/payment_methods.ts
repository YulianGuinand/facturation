import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const createPaymentMethod = mutation({
  args: {
    companyId: v.id("companies"),
    name: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const { companyId, name, code } = args;
    return await ctx.db.insert("paymentMethods", {
      companyId,
      name,
      code,
      isActive: true,
    });
  },
});
