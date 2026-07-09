import { v } from "convex/values";
import { query } from "../_generated/server";

export const getBankAccounts = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bankAccounts")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getDefaultBankAccount = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bankAccounts")
      .withIndex("by_company_default", (q) =>
        q.eq("companyId", args.companyId).eq("isDefault", true)
      )
      .first();
  },
});
