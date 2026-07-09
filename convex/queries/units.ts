import { v } from "convex/values";
import { query } from "../_generated/server";

export const getUnitById = query({
  args: { unitId: v.id("units") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.unitId);
  },
});

export const getUnits = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("units")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});
