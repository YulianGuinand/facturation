import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const upsertBankAccount = mutation({
  args: {
    bankAccountId: v.optional(v.id("bankAccounts")),
    companyId: v.id("companies"),
    name: v.string(),
    iban: v.string(),
    bic: v.string(),
    bankName: v.optional(v.string()),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { bankAccountId, ...data } = args;

    if (data.isDefault) {
      const existingDefaults = await ctx.db
        .query("bankAccounts")
        .withIndex("by_company_default", (q) =>
          q.eq("companyId", data.companyId).eq("isDefault", true)
        )
        .collect();
      for (const acc of existingDefaults) {
        await ctx.db.patch(acc._id, { isDefault: false });
      }
    }

    if (bankAccountId) {
      await ctx.db.patch(bankAccountId, { ...data, isActive: true });
      return bankAccountId;
    }

    const id = await ctx.db.insert("bankAccounts", {
      ...data,
      isActive: true,
    });
    return id;
  },
});

export const deleteBankAccount = mutation({
  args: {
    bankAccountId: v.id("bankAccounts"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const acc = await ctx.db.get(args.bankAccountId);
    if (!acc || acc.companyId !== args.companyId) throw new Error("Compte introuvable");
    await ctx.db.delete(args.bankAccountId);
  },
});
