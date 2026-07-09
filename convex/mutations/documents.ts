import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { createAuditLog, createDocumentHistory } from "../lib/audit";
import { getNextSequence, getPrefixForType } from "../helpers/sequences";

const DOCUMENT_TYPES = [
  "quote",
  "invoice",
  "credit_note",
  "purchase_order",
  "deposit_invoice",
  "progress_invoice",
] as const;

const DOCUMENT_STATUSES = [
  "draft",
  "sent",
  "accepted",
  "refused",
  "paid",
  "partially_paid",
  "cancelled",
  "expired",
] as const;

export const createDocument = mutation({
  args: {
    companyId: v.id("companies"),
    customerId: v.id("customers"),
    type: v.union(...DOCUMENT_TYPES.map((t) => v.literal(t))),
    issueDate: v.number(),
    saleDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    validityDate: v.optional(v.number()),
    operationCategory: v.optional(v.string()),
    internalReference: v.optional(v.string()),
    orderReference: v.optional(v.string()),
    contractReference: v.optional(v.string()),
    currency: v.optional(v.string()),
    language: v.optional(v.string()),
    paymentTerms: v.optional(v.string()),
    paymentMethodId: v.optional(v.id("paymentMethods")),
    bankAccountId: v.optional(v.id("bankAccounts")),
    latePenaltyRate: v.optional(v.number()),
    flatRateIndemnity: v.optional(v.number()),
    legalNotes: v.optional(v.string()),
    customerNotes: v.optional(v.string()),
    internalNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("companySettings")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .unique();

    const prefix = getPrefixForType(args.type, settings ?? undefined);
    const year = new Date(args.issueDate).getFullYear();

    const { sequenceId, number } = await getNextSequence(ctx, args.companyId, prefix, year);

    const defaultCurrency = settings?.defaultCurrency ?? "EUR";
    const defaultLanguage = "fr";

    const docId = await ctx.db.insert("documents", {
      companyId: args.companyId,
      customerId: args.customerId,
      type: args.type,
      status: "draft",
      number,
      sequenceId,
      issueDate: args.issueDate,
      saleDate: args.saleDate,
      dueDate: args.dueDate,
      validityDate: args.validityDate,
      operationCategory: args.operationCategory,
      internalReference: args.internalReference,
      orderReference: args.orderReference,
      contractReference: args.contractReference,
      currency: args.currency ?? defaultCurrency,
      language: args.language ?? defaultLanguage,
      subtotalExclTax: 0,
      totalExclTax: 0,
      totalVat: 0,
      totalInclTax: 0,
      amountPaid: 0,
      amountDue: 0,
      paymentTerms: args.paymentTerms,
      paymentMethodId: args.paymentMethodId,
      bankAccountId: args.bankAccountId,
      latePenaltyRate: args.latePenaltyRate,
      flatRateIndemnity: args.flatRateIndemnity,
      legalNotes: args.legalNotes,
      customerNotes: args.customerNotes,
      internalNotes: args.internalNotes,
      isArchived: false,
      createdBy: undefined,
    });

    await createAuditLog(ctx, {
      companyId: args.companyId,
      entityType: "documents",
      entityId: docId,
      action: "create",
      metadata: { type: args.type, number },
    });

    await createDocumentHistory(ctx, {
      companyId: args.companyId,
      documentId: docId,
      action: "create",
      metadata: { type: args.type, number },
    });

    return docId;
  },
});

export const updateDocument = mutation({
  args: {
    documentId: v.id("documents"),
    companyId: v.id("companies"),
    customerId: v.optional(v.id("customers")),
    issueDate: v.optional(v.number()),
    saleDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    validityDate: v.optional(v.number()),
    operationCategory: v.optional(v.string()),
    internalReference: v.optional(v.string()),
    orderReference: v.optional(v.string()),
    contractReference: v.optional(v.string()),
    paymentTerms: v.optional(v.string()),
    paymentMethodId: v.optional(v.id("paymentMethods")),
    bankAccountId: v.optional(v.id("bankAccounts")),
    latePenaltyRate: v.optional(v.number()),
    flatRateIndemnity: v.optional(v.number()),
    legalNotes: v.optional(v.string()),
    customerNotes: v.optional(v.string()),
    internalNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { documentId, ...fields } = args;
    const doc = await ctx.db.get(documentId);
    if (!doc) throw new Error("Document introuvable");
    if (doc.companyId !== args.companyId) throw new Error("Accès refusé");
    if (doc.status !== "draft") throw new Error("Seuls les brouillons peuvent être modifiés");

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && key !== "companyId") {
        updates[key] = value;
      }
    }

    await ctx.db.patch(documentId, updates);

    await createAuditLog(ctx, {
      companyId: args.companyId,
      entityType: "documents",
      entityId: documentId,
      action: "update",
      metadata: { updatedFields: Object.keys(updates) },
    });

    await createDocumentHistory(ctx, {
      companyId: args.companyId,
      documentId,
      action: "update",
      metadata: { updatedFields: Object.keys(updates) },
    });
  },
});

export const changeDocumentStatus = mutation({
  args: {
    documentId: v.id("documents"),
    companyId: v.id("companies"),
    status: v.union(...DOCUMENT_STATUSES.map((s) => v.literal(s))),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error("Document introuvable");
    if (doc.companyId !== args.companyId) throw new Error("Accès refusé");

    await ctx.db.patch(args.documentId, { status: args.status });

    await createAuditLog(ctx, {
      companyId: args.companyId,
      entityType: "documents",
      entityId: args.documentId,
      action: `status_${args.status}`,
      metadata: { previousStatus: doc.status },
    });

    await createDocumentHistory(ctx, {
      companyId: args.companyId,
      documentId: args.documentId,
      action: `status_${args.status}`,
      metadata: { previousStatus: doc.status },
    });
  },
});

export const archiveDocument = mutation({
  args: {
    documentId: v.id("documents"),
    companyId: v.id("companies"),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error("Document introuvable");
    if (doc.companyId !== args.companyId) throw new Error("Accès refusé");

    await ctx.db.patch(args.documentId, {
      isArchived: true,
      archivedAt: Date.now(),
      archivedBy: args.userId,
    });

    await createAuditLog(ctx, {
      companyId: args.companyId,
      entityType: "documents",
      entityId: args.documentId,
      action: "archive",
      userId: args.userId,
    });

    await createDocumentHistory(ctx, {
      companyId: args.companyId,
      documentId: args.documentId,
      action: "archive",
      userId: args.userId,
    });
  },
});

export const convertQuoteToInvoice = mutation({
  args: {
    quoteId: v.id("documents"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.quoteId);
    if (!quote) throw new Error("Devis introuvable");
    if (quote.companyId !== args.companyId) throw new Error("Accès refusé");
    if (quote.type !== "quote") throw new Error("Le document n'est pas un devis");
    if (quote.status !== "accepted") throw new Error("Seuls les devis acceptés peuvent être convertis");

    const settings = await ctx.db
      .query("companySettings")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .unique();

    const year = new Date().getFullYear();
    const { sequenceId, number } = await getNextSequence(
      ctx,
      args.companyId,
      getPrefixForType("invoice", settings ?? undefined),
      year
    );

    const invoiceId = await ctx.db.insert("documents", {
      companyId: quote.companyId,
      customerId: quote.customerId,
      type: "invoice",
      status: "draft",
      number,
      sequenceId,
      issueDate: Date.now(),
      currency: quote.currency,
      language: quote.language,
      subtotalExclTax: quote.subtotalExclTax,
      totalExclTax: quote.totalExclTax,
      totalVat: quote.totalVat,
      totalInclTax: quote.totalInclTax,
      amountPaid: 0,
      amountDue: quote.totalInclTax,
      orderReference: quote.number,
      contractReference: quote.contractReference,
      latePenaltyRate: quote.latePenaltyRate,
      flatRateIndemnity: quote.flatRateIndemnity,
      legalNotes: quote.legalNotes,
      customerNotes: quote.customerNotes,
      isArchived: false,
      dueDate: Date.now() + (settings?.defaultPaymentTermsDays ?? 30) * 86400000,
    });

    const items = await ctx.db
      .query("documentItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.quoteId))
      .collect();

    for (const item of items) {
      await ctx.db.insert("documentItems", {
        companyId: item.companyId,
        documentId: invoiceId,
        lineNumber: item.lineNumber,
        reference: item.reference,
        designation: item.designation,
        description: item.description,
        quantity: item.quantity,
        unitId: item.unitId,
        unitPriceExclTax: item.unitPriceExclTax,
        discountPercent: item.discountPercent,
        discountAmount: item.discountAmount,
        vatRateId: item.vatRateId,
        vatRate: item.vatRate,
        vatAmount: item.vatAmount,
        totalExclTax: item.totalExclTax,
        totalInclTax: item.totalInclTax,
      });
    }

    await createAuditLog(ctx, {
      companyId: args.companyId,
      entityType: "documents",
      entityId: invoiceId,
      action: "convert_quote_to_invoice",
      metadata: { quoteId: args.quoteId, quoteNumber: quote.number },
    });

    await createDocumentHistory(ctx, {
      companyId: args.companyId,
      documentId: invoiceId,
      action: "created_from_quote",
      metadata: { quoteId: args.quoteId, quoteNumber: quote.number },
    });

    return invoiceId;
  },
});

export const createCreditNote = mutation({
  args: {
    invoiceId: v.id("documents"),
    companyId: v.id("companies"),
    reason: v.string(),
    items: v.array(v.id("documentItems")),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("Facture introuvable");
    if (invoice.companyId !== args.companyId) throw new Error("Accès refusé");
    if (invoice.type !== "invoice") throw new Error("Le document n'est pas une facture");

    const settings = await ctx.db
      .query("companySettings")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .unique();

    const year = new Date().getFullYear();
    const { sequenceId, number } = await getNextSequence(
      ctx,
      args.companyId,
      getPrefixForType("credit_note", settings ?? undefined),
      year
    );

    const creditNoteId = await ctx.db.insert("documents", {
      companyId: args.companyId,
      customerId: invoice.customerId,
      type: "credit_note",
      status: "draft",
      number,
      sequenceId,
      issueDate: Date.now(),
      currency: invoice.currency,
      language: invoice.language,
      subtotalExclTax: 0,
      totalExclTax: 0,
      totalVat: 0,
      totalInclTax: 0,
      amountPaid: 0,
      amountDue: 0,
      contractReference: args.reason,
      internalNotes: `Avoir créé depuis la facture ${invoice.number}`,
      isArchived: false,
      orderReference: invoice.number,
    });

    let totalExclTax = 0;
    let totalVat = 0;
    let totalInclTax = 0;

    for (const itemId of args.items) {
      const item = await ctx.db.get(itemId);
      if (!item || item.documentId !== args.invoiceId) continue;

      await ctx.db.insert("documentItems", {
        companyId: args.companyId,
        documentId: creditNoteId,
        lineNumber: item.lineNumber,
        reference: item.reference,
        designation: item.designation,
        description: `[AVOIR] ${item.description ?? item.designation}`,
        quantity: item.quantity,
        unitId: item.unitId,
        unitPriceExclTax: item.unitPriceExclTax,
        discountPercent: item.discountPercent,
        discountAmount: item.discountAmount,
        vatRateId: item.vatRateId,
        vatRate: item.vatRate,
        vatAmount: item.vatAmount,
        totalExclTax: item.totalExclTax,
        totalInclTax: item.totalInclTax,
      });

      totalExclTax += item.totalExclTax;
      totalVat += item.vatAmount;
      totalInclTax += item.totalInclTax;
    }

    await ctx.db.patch(creditNoteId, {
      subtotalExclTax: totalExclTax,
      totalExclTax,
      totalVat,
      totalInclTax,
      amountDue: totalInclTax,
    });

    await createAuditLog(ctx, {
      companyId: args.companyId,
      entityType: "documents",
      entityId: creditNoteId,
      action: "create_credit_note",
      metadata: { invoiceId: args.invoiceId, invoiceNumber: invoice.number, reason: args.reason },
    });

    return creditNoteId;
  },
});

export const duplicateDocument = mutation({
  args: {
    documentId: v.id("documents"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.documentId);
    if (!original || original.companyId !== args.companyId) throw new Error("Document introuvable");

    const settings = await ctx.db
      .query("companySettings")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .unique();

    const year = new Date().getFullYear();
    const prefix = getPrefixForType(original.type, settings ?? undefined);
    const { sequenceId, number } = await getNextSequence(ctx, args.companyId, prefix, year);

    const newDocId = await ctx.db.insert("documents", {
      companyId: original.companyId,
      customerId: original.customerId,
      type: original.type,
      status: "draft",
      number,
      sequenceId,
      issueDate: Date.now(),
      dueDate: original.dueDate,
      validityDate: original.validityDate,
      currency: original.currency,
      language: original.language,
      subtotalExclTax: original.subtotalExclTax,
      totalExclTax: original.totalExclTax,
      totalVat: original.totalVat,
      totalInclTax: original.totalInclTax,
      amountPaid: 0,
      amountDue: original.totalInclTax,
      orderReference: original.orderReference,
      internalReference: original.internalReference,
      latePenaltyRate: original.latePenaltyRate,
      flatRateIndemnity: original.flatRateIndemnity,
      legalNotes: original.legalNotes,
      customerNotes: original.customerNotes,
      isArchived: false,
    });

    const items = await ctx.db
      .query("documentItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    for (const item of items) {
      await ctx.db.insert("documentItems", {
        companyId: item.companyId,
        documentId: newDocId,
        lineNumber: item.lineNumber,
        reference: item.reference,
        designation: item.designation,
        description: item.description,
        quantity: item.quantity,
        unitId: item.unitId,
        unitPriceExclTax: item.unitPriceExclTax,
        discountPercent: item.discountPercent,
        discountAmount: item.discountAmount,
        vatRateId: item.vatRateId,
        vatRate: item.vatRate,
        vatAmount: item.vatAmount,
        totalExclTax: item.totalExclTax,
        totalInclTax: item.totalInclTax,
      });
    }

    await createAuditLog(ctx, {
      companyId: args.companyId,
      entityType: "documents",
      entityId: newDocId,
      action: "duplicate",
      metadata: { originalId: args.documentId, originalNumber: original.number },
    });

    return newDocId;
  },
});

export const deleteDocument = mutation({
  args: {
    documentId: v.id("documents"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.companyId !== args.companyId) throw new Error("Document introuvable");

    const items = await ctx.db
      .query("documentItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.documentId);
  },
});
