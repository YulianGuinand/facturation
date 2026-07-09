import { v } from "convex/values";
import { query } from "../_generated/server";

export const getDocumentById = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId);
  },
});

export const getDocument = query({
  args: { documentId: v.id("documents"), companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.companyId !== args.companyId) return null;
    return doc;
  },
});

export const getDocuments = query({
  args: {
    companyId: v.id("companies"),
    type: v.optional(v.union(
      v.literal("quote"),
      v.literal("invoice"),
      v.literal("credit_note"),
      v.literal("purchase_order"),
      v.literal("deposit_invoice"),
      v.literal("progress_invoice")
    )),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("accepted"),
      v.literal("refused"),
      v.literal("paid"),
      v.literal("partially_paid"),
      v.literal("cancelled"),
      v.literal("expired")
    )),
    isArchived: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let docs;

    if (args.type) {
      docs = await ctx.db
        .query("documents")
        .withIndex("by_company_type", (q) =>
          q.eq("companyId", args.companyId).eq("type", args.type!)
        )
        .order("desc")
        .collect();
    } else {
      docs = await ctx.db
        .query("documents")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .order("desc")
        .collect();
    }

    if (args.status) {
      docs = docs.filter((d) => d.status === args.status);
    }
    if (args.isArchived !== undefined) {
      docs = docs.filter((d) => d.isArchived === args.isArchived);
    }

    const offset = args.offset ?? 0;
    const limit = args.limit ?? 50;

    return docs.slice(offset, offset + limit);
  },
});

export const getRecentDocuments = query({
  args: {
    companyId: v.id("companies"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 15;
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_company_issue_date", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .take(limit);

    return docs.filter((d) => !d.isArchived);
  },
});

export const getDocumentWithItems = query({
  args: { documentId: v.id("documents"), companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.companyId !== args.companyId) return null;

    const items = await ctx.db
      .query("documentItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .order("asc")
      .collect();

    const customer = doc.customerId ? await ctx.db.get(doc.customerId) : null;

    return { document: doc, items, customer };
  },
});

export const getDocumentsWithCustomers = query({
  args: {
    companyId: v.id("companies"),
    type: v.optional(v.union(
      v.literal("quote"),
      v.literal("invoice"),
      v.literal("credit_note"),
      v.literal("purchase_order"),
      v.literal("deposit_invoice"),
      v.literal("progress_invoice")
    )),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("accepted"),
      v.literal("refused"),
      v.literal("paid"),
      v.literal("partially_paid"),
      v.literal("cancelled"),
      v.literal("expired")
    )),
    isArchived: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let docs;

    if (args.type) {
      docs = await ctx.db
        .query("documents")
        .withIndex("by_company_type", (q) =>
          q.eq("companyId", args.companyId).eq("type", args.type!)
        )
        .order("desc")
        .collect();
    } else {
      docs = await ctx.db
        .query("documents")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .order("desc")
        .collect();
    }

    if (args.status) {
      docs = docs.filter((d) => d.status === args.status);
    }
    if (args.isArchived !== undefined) {
      docs = docs.filter((d) => d.isArchived === args.isArchived);
    }

    const offset = args.offset ?? 0;
    const limit = args.limit ?? 50;
    const sliced = docs.slice(offset, offset + limit);

    const customerIds = [...new Set(sliced.map((d) => d.customerId).filter(Boolean))] as any[];
    const customerMap = new Map<any, any>();
    for (const id of customerIds) {
      const c = await ctx.db.get(id);
      if (c) customerMap.set(id, c);
    }

    return sliced.map((d: any) => {
      const c = d.customerId ? customerMap.get(d.customerId) : undefined;
      const name = c
        ? c.companyName ?? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim()
        : undefined;
      return { ...d, customerName: name || null };
    });
  },
});

export const getDocumentItems = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documentItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();
  },
});

export const getPaymentMethodById = query({
  args: { paymentMethodId: v.id("paymentMethods") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.paymentMethodId);
  },
});

export const getPaymentMethods = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paymentMethods")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});
