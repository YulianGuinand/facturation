import { v } from "convex/values";
import { query } from "../_generated/server";

export const getDashboardStats = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const activeDocs = docs.filter((d) => !d.isArchived);

    const quoteCount = activeDocs.filter((d) => d.type === "quote").length;
    const invoiceCount = activeDocs.filter((d) => d.type === "invoice").length;

    const revenue = activeDocs
      .filter((d) => d.type === "invoice" && (d.status === "paid" || d.status === "partially_paid"))
      .reduce((sum, d) => sum + d.amountPaid, 0);

    const pending = activeDocs
      .filter((d) => d.type === "invoice" && d.amountDue > 0)
      .reduce((sum, d) => sum + d.amountDue, 0);

    return {
      quoteCount,
      invoiceCount,
      revenue,
      pending,
    };
  },
});

export const getUpcomingDueDates = query({
  args: { companyId: v.id("companies"), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days ?? 30;
    const now = Date.now();
    const limit = now + days * 86400000;

    const docs = await ctx.db
      .query("documents")
      .withIndex("by_company_due_date", (q) => q.eq("companyId", args.companyId))
      .collect();

    return docs
      .filter((d) => {
        if (d.isArchived) return false;
        if (!d.dueDate) return false;
        if (d.status === "paid" || d.status === "cancelled") return false;
        return d.dueDate >= now && d.dueDate <= limit;
      })
      .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0));
  },
});
