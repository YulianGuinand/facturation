import { v } from "convex/values";
import { query } from "../_generated/server";

export const getCustomer = query({
  args: { customerId: v.id("customers"), companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.companyId !== args.companyId) return null;
    return customer;
  },
});

export const getCustomers = query({
  args: {
    companyId: v.id("companies"),
    isActive: v.optional(v.boolean()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    let filtered = customers;
    if (args.isActive !== undefined) {
      filtered = filtered.filter((c) => c.isActive === args.isActive);
    }
    if (args.search) {
      const s = args.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          (c.companyName?.toLowerCase().includes(s)) ||
          (c.firstName?.toLowerCase().includes(s)) ||
          (c.lastName?.toLowerCase().includes(s)) ||
          c.email?.toLowerCase().includes(s)
      );
    }

    return filtered.sort((a, b) => {
      const aName = a.companyName ?? `${a.lastName ?? ""} ${a.firstName ?? ""}`;
      const bName = b.companyName ?? `${b.lastName ?? ""} ${b.firstName ?? ""}`;
      return aName.localeCompare(bName);
    });
  },
});

export const getCustomersList = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    return customers
      .filter((c) => c.isActive)
      .map((c) => ({
        _id: c._id,
        displayName: c.companyName ?? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim(),
        email: c.email,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});
