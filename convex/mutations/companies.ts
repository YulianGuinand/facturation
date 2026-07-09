import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { createAuditLog } from "../lib/audit";

export const createCompany = mutation({
  args: {
    name: v.string(),
    legalForm: v.string(),
    siren: v.string(),
    siret: v.string(),
    isMicroEnterprise: v.boolean(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    rcs: v.optional(v.string()),
    shareCapital: v.optional(v.number()),
    addressLine1: v.optional(v.string()),
    addressLine2: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { addressLine1, addressLine2, postalCode, city, country, ...companyFields } = args;

    const companyId = await ctx.db.insert("companies", {
      ...companyFields,
      isActive: true,
    });

    if (addressLine1 || postalCode || city) {
      const addressId = await ctx.db.insert("addresses", {
        companyId,
        line1: addressLine1 ?? "",
        line2: addressLine2,
        postalCode: postalCode ?? "",
        city: city ?? "",
        country: country ?? "France",
        countryCode: "FR",
      });
      await ctx.db.patch(companyId, { addressId });
    }

    await ctx.db.insert("companySettings", {
      companyId,
      defaultCurrency: "EUR",
      defaultPaymentTermsDays: 30,
      latePenaltyRate: 300,
      flatRateIndemnity: 4000,
      invoicePrefix: "FAC",
      quotePrefix: "DEV",
      creditNotePrefix: "AV",
      purchaseOrderPrefix: "BC",
      resetSequencesAnnually: true,
      vatRegime: "normal",
    });

    const taxRates = [
      { name: "TVA 20%", rate: 2000, code: "TVA20", isDefault: true, isActive: true },
      { name: "TVA 10%", rate: 1000, code: "TVA10", isDefault: false, isActive: true },
      { name: "TVA 5.5%", rate: 550, code: "TVA55", isDefault: false, isActive: true },
      { name: "TVA 2.1%", rate: 210, code: "TVA21", isDefault: false, isActive: true },
    ];

    for (const tax of taxRates) {
      await ctx.db.insert("taxRates", { ...tax, companyId });
    }

    const units = [
      { name: "Unité", abbreviation: "u", code: "C62", isActive: true },
      { name: "Heure", abbreviation: "h", code: "HUR", isActive: true },
      { name: "Jour", abbreviation: "j", code: "DAY", isActive: true },
      { name: "Forfait", abbreviation: "ft", code: "LS", isActive: true },
    ];

    for (const unit of units) {
      await ctx.db.insert("units", { ...unit, companyId });
    }

    const paymentMethods = [
      { name: "Virement bancaire", code: "transfer", isActive: true },
      { name: "Carte bancaire", code: "card", isActive: true },
      { name: "Chèque", code: "check", isActive: true },
      { name: "Espèces", code: "cash", isActive: true },
      { name: "Prélèvement", code: "direct_debit", isActive: true },
    ];

    for (const pm of paymentMethods) {
      await ctx.db.insert("paymentMethods", { ...pm, companyId });
    }

    return companyId;
  },
});

export const updateCompany = mutation({
  args: {
    companyId: v.id("companies"),
    name: v.optional(v.string()),
    legalForm: v.optional(v.string()),
    siren: v.optional(v.string()),
    siret: v.optional(v.string()),
    isMicroEnterprise: v.optional(v.boolean()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    rcs: v.optional(v.string()),
    shareCapital: v.optional(v.number()),
    addressLine1: v.optional(v.string()),
    addressLine2: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { companyId, addressLine1, addressLine2, postalCode, city, country, ...companyFields } = args;

    const company = await ctx.db.get(companyId);
    if (!company) throw new Error("Société introuvable");

    const nonEmptyFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(companyFields)) {
      if (value !== undefined) {
        nonEmptyFields[key] = value;
      }
    }

    if (Object.keys(nonEmptyFields).length > 0) {
      await ctx.db.patch(companyId, nonEmptyFields);
    }

    if (addressLine1 !== undefined || postalCode !== undefined || city !== undefined) {
      if (company.addressId) {
        await ctx.db.patch(company.addressId, {
          line1: addressLine1 ?? "",
          line2: addressLine2,
          postalCode: postalCode ?? "",
          city: city ?? "",
          country: country ?? "France",
          countryCode: "FR",
        });
      } else {
        const addressId = await ctx.db.insert("addresses", {
          companyId,
          line1: addressLine1 ?? "",
          line2: addressLine2,
          postalCode: postalCode ?? "",
          city: city ?? "",
          country: country ?? "France",
          countryCode: "FR",
        });
        await ctx.db.patch(companyId, { addressId });
      }
    }

    await createAuditLog(ctx, {
      companyId,
      entityType: "companies",
      entityId: companyId,
      action: "update",
      metadata: { updatedFields: Object.keys(nonEmptyFields) },
    });

    return companyId;
  },
});

export const archiveCompany = mutation({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) throw new Error("Société introuvable");

    await ctx.db.patch(args.companyId, { isActive: false });

    await createAuditLog(ctx, {
      companyId: args.companyId,
      entityType: "companies",
      entityId: args.companyId,
      action: "archive",
    });
  },
});
