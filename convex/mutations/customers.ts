import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { createAuditLog } from "../lib/audit";

export const createCustomer = mutation({
  args: {
    companyId: v.id("companies"),
    type: v.union(v.literal("individual"), v.literal("professional")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    companyName: v.optional(v.string()),
    siren: v.optional(v.string()),
    siret: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    billingAddressId: v.optional(v.id("addresses")),
    deliveryAddressId: v.optional(v.id("addresses")),
    notes: v.optional(v.string()),
    addressLine1: v.optional(v.string()),
    addressLine2: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { addressLine1, addressLine2, postalCode, city, country, ...customerFields } = args;

    let billingAddressId = args.billingAddressId;
    if (addressLine1 || postalCode || city) {
      billingAddressId = await ctx.db.insert("addresses", {
        companyId: args.companyId,
        line1: addressLine1 ?? "",
        line2: addressLine2,
        postalCode: postalCode ?? "",
        city: city ?? "",
        country: country ?? "France",
        countryCode: "FR",
      });
    }

    const customerId = await ctx.db.insert("customers", {
      ...customerFields,
      billingAddressId: billingAddressId as any,
      isActive: true,
    });

    await createAuditLog(ctx, {
      companyId: args.companyId,
      entityType: "customers",
      entityId: customerId,
      action: "create",
      userId: undefined,
    });

    return customerId;
  },
});

export const updateCustomer = mutation({
  args: {
    customerId: v.id("customers"),
    companyId: v.id("companies"),
    type: v.optional(v.union(v.literal("individual"), v.literal("professional"))),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    companyName: v.optional(v.string()),
    siren: v.optional(v.string()),
    siret: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    billingAddressId: v.optional(v.id("addresses")),
    deliveryAddressId: v.optional(v.id("addresses")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { customerId, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && key !== "companyId") {
        updates[key] = value;
      }
    }

    await ctx.db.patch(customerId, updates);

    await createAuditLog(ctx, {
      companyId: args.companyId,
      entityType: "customers",
      entityId: customerId,
      action: "update",
      metadata: { updatedFields: Object.keys(updates) },
    });

    return customerId;
  },
});

export const archiveCustomer = mutation({
  args: {
    customerId: v.id("customers"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Client introuvable");
    if (customer.companyId !== args.companyId) throw new Error("Accès refusé");

    await ctx.db.patch(args.customerId, { isActive: false });

    await createAuditLog(ctx, {
      companyId: args.companyId,
      entityType: "customers",
      entityId: args.customerId,
      action: "archive",
    });
  },
});

export const deleteCustomer = mutation({
  args: {
    customerId: v.id("customers"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Client introuvable");
    if (customer.companyId !== args.companyId) throw new Error("Accès refusé");

    await ctx.db.delete(args.customerId);

    await createAuditLog(ctx, {
      companyId: args.companyId,
      entityType: "customers",
      entityId: args.customerId,
      action: "delete",
    });
  },
});
