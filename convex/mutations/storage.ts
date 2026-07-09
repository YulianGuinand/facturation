import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveLogo = mutation({
  args: {
    companyId: v.id("companies"),
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) throw new Error("Société introuvable");
    await ctx.db.patch(args.companyId, { logoStorageId: args.storageId });
  },
});

export const deleteLogo = mutation({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company || !company.logoStorageId) return;
    await ctx.storage.delete(company.logoStorageId as any);
    await ctx.db.patch(args.companyId, { logoStorageId: undefined });
  },
});
