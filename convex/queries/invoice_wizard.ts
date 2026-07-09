import { v } from "convex/values";
import { query } from "../_generated/server";

export const getProducts = query({
  args: {
    companyId: v.id("companies"),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.search && args.search.trim().length > 0) {
      const results = await ctx.db
        .query("products")
        .withSearchIndex("search_name", (q) =>
          q.search("name", args.search!).eq("companyId", args.companyId)
        )
        .take(20);
      return results;
    }
    return await ctx.db
      .query("products")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(50);
  },
});

export const getInvoiceWizardData = query({
  args: {
    documentId: v.id("documents"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.companyId !== args.companyId) return null;

    const items = await ctx.db
      .query("documentItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .order("asc")
      .collect();

    let customer = null;
    if (doc.customerId) {
      customer = await ctx.db.get(doc.customerId);
    }

    const taxRates = await ctx.db
      .query("taxRates")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const units = await ctx.db
      .query("units")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const paymentMethods = await ctx.db
      .query("paymentMethods")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return {
      document: doc,
      items,
      customer,
      taxRates,
      units,
      paymentMethods,
    };
  },
});
