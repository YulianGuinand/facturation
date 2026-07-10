import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { createAuditLog, createDocumentHistory } from "../lib/audit";
import { getNextSequence, getPrefixForType } from "../helpers/sequences";

export const createInvoiceDraft = mutation({
  args: {
    companyId: v.id("companies"),
    customerId: v.optional(v.id("customers")),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("companySettings")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .unique();

    const year = new Date().getFullYear();
    const prefix = getPrefixForType("invoice", settings ?? undefined);
    const { sequenceId, number } = await getNextSequence(ctx, args.companyId, prefix, year);

    const today = Date.now();
    const defaultDue = today + (settings?.defaultPaymentTermsDays ?? 30) * 86400000;

    const docId = await ctx.db.insert("documents", {
      companyId: args.companyId,
      customerId: args.customerId,
      type: "invoice",
      status: "draft",
      number,
      sequenceId,
      issueDate: today,
      dueDate: defaultDue,
      currency: settings?.defaultCurrency ?? "EUR",
      language: "fr",
      subtotalExclTax: 0,
      totalExclTax: 0,
      totalVat: 0,
      totalInclTax: 0,
      amountPaid: 0,
      amountDue: 0,
      latePenaltyRate: settings?.latePenaltyRate,
      flatRateIndemnity: settings?.flatRateIndemnity,
      legalNotes: settings?.legalNotes,
      isArchived: false,
    });

    await createAuditLog(ctx, {
      companyId: args.companyId,
      entityType: "documents",
      entityId: docId,
      action: "create",
      metadata: { type: "invoice", number, wizard: true },
    });

    return { documentId: docId, number };
  },
});

export const updateInvoiceClient = mutation({
  args: {
    documentId: v.id("documents"),
    companyId: v.id("companies"),
    customerId: v.id("customers"),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.companyId !== args.companyId) throw new Error("Accès refusé");

    await ctx.db.patch(args.documentId, { customerId: args.customerId });
  },
});

export const updateInvoiceInfo = mutation({
  args: {
    documentId: v.id("documents"),
    companyId: v.id("companies"),
    issueDate: v.optional(v.number()),
    saleDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    paymentTerms: v.optional(v.string()),
    paymentMethodId: v.optional(v.id("paymentMethods")),
    bankAccountId: v.optional(v.id("bankAccounts")),
    currency: v.optional(v.string()),
    language: v.optional(v.string()),
    orderReference: v.optional(v.string()),
    internalReference: v.optional(v.string()),
    customerNotes: v.optional(v.string()),
    internalNotes: v.optional(v.string()),
    legalNotes: v.optional(v.string()),
    latePenaltyRate: v.optional(v.number()),
    flatRateIndemnity: v.optional(v.number()),
    operationCategory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { documentId, ...fields } = args;
    const doc = await ctx.db.get(documentId);
    if (!doc || doc.companyId !== args.companyId) throw new Error("Accès refusé");

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && key !== "companyId") updates[key] = value;
    }

    await ctx.db.patch(documentId, updates);
  },
});

export const updateInvoiceTotals = mutation({
  args: {
    documentId: v.id("documents"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.companyId !== args.companyId) throw new Error("Accès refusé");

    const items = await ctx.db
      .query("documentItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    let subtotalExclTax = 0;
    let totalVat = 0;

    for (const item of items) {
      subtotalExclTax += item.totalExclTax;
      totalVat += item.vatAmount;
    }

    const totalInclTax = subtotalExclTax + totalVat;

    await ctx.db.patch(args.documentId, {
      subtotalExclTax,
      totalExclTax: subtotalExclTax,
      totalVat,
      totalInclTax,
      amountDue: totalInclTax,
    });
  },
});

export const addInvoiceLine = mutation({
  args: {
    documentId: v.id("documents"),
    companyId: v.id("companies"),
    designation: v.string(),
    reference: v.optional(v.string()),
    description: v.optional(v.string()),
    quantity: v.number(),
    unitId: v.optional(v.id("units")),
    unitPriceExclTax: v.number(),
    discountPercent: v.optional(v.number()),
    vatRateId: v.optional(v.id("taxRates")),
    vatRate: v.number(),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.companyId !== args.companyId) throw new Error("Accès refusé");

    const existingItems = await ctx.db
      .query("documentItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    const lineNumber = existingItems.length + 1;
    const qty = args.quantity;
    const discountPercent = args.discountPercent ?? 0;
    let totalExclTax = qty * args.unitPriceExclTax;
    if (discountPercent > 0) {
      totalExclTax -= Math.round(totalExclTax * (discountPercent / 10000));
    }
    const vatAmount = Math.round(totalExclTax * (args.vatRate / 10000));
    const totalInclTax = totalExclTax + vatAmount;

    const itemId = await ctx.db.insert("documentItems", {
      companyId: args.companyId,
      documentId: args.documentId,
      lineNumber,
      reference: args.reference,
      designation: args.designation,
      description: args.description,
      quantity: qty,
      unitId: args.unitId,
      unitPriceExclTax: args.unitPriceExclTax,
      discountPercent: discountPercent > 0 ? discountPercent : undefined,
      vatRateId: args.vatRateId,
      vatRate: args.vatRate,
      vatAmount,
      totalExclTax,
      totalInclTax,
    });

    return itemId;
  },
});

export const removeInvoiceLine = mutation({
  args: {
    itemId: v.id("documentItems"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Ligne introuvable");
    await ctx.db.delete(args.itemId);
  },
});

export const updateInvoiceLine = mutation({
  args: {
    itemId: v.id("documentItems"),
    companyId: v.id("companies"),
    quantity: v.optional(v.number()),
    unitPriceExclTax: v.optional(v.number()),
    discountPercent: v.optional(v.number()),
    vatRate: v.optional(v.number()),
    designation: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Ligne introuvable");

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined && key !== "itemId" && key !== "companyId") {
        updates[key] = value;
      }
    }

    const qty = (updates.quantity as number) ?? item.quantity;
    const up = (updates.unitPriceExclTax as number) ?? item.unitPriceExclTax;
    const dp = (updates.discountPercent as number) ?? item.discountPercent ?? 0;
    const vr = (updates.vatRate as number) ?? item.vatRate;

    let totalExclTax = qty * up;
    if (dp > 0) totalExclTax -= Math.round(totalExclTax * (dp / 10000));
    const vatAmount = Math.round(totalExclTax * (vr / 10000));
    const totalInclTax = totalExclTax + vatAmount;

    await ctx.db.patch(args.itemId, {
      ...updates,
      vatAmount,
      totalExclTax,
      totalInclTax,
    });
  },
});

export const finalizeInvoice = mutation({
  args: {
    documentId: v.id("documents"),
    companyId: v.id("companies"),
    status: v.union(v.literal("draft"), v.literal("sent")),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.companyId !== args.companyId) throw new Error("Accès refusé");

    await ctx.db.patch(args.documentId, { status: args.status });

    await createAuditLog(ctx, {
      companyId: args.companyId,
      entityType: "documents",
      entityId: args.documentId,
      action: `finalize_${args.status}`,
    });

    await createDocumentHistory(ctx, {
      companyId: args.companyId,
      documentId: args.documentId,
      action: `finalize_${args.status}`,
    });
  },
});

export const createProduct = mutation({
  args: {
    companyId: v.id("companies"),
    name: v.string(),
    reference: v.string(),
    description: v.optional(v.string()),
    unitId: v.optional(v.id("units")),
    priceExclTax: v.number(),
    vatRateId: v.optional(v.id("taxRates")),
    vatRate: v.number(),
  },
  handler: async (ctx, args) => {
    const productId = await ctx.db.insert("products", {
      ...args,
      isActive: true,
    });
    return productId;
  },
});
