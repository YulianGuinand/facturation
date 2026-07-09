import type { Id } from "../_generated/dataModel";

export const documentPrefixes = {
  quote: "DEV",
  invoice: "FAC",
  credit_note: "AV",
  purchase_order: "BC",
  deposit_invoice: "FAC-A",
  progress_invoice: "FAC-S",
} as const;

export function getPrefixForType(type: string, settings?: {
  quotePrefix?: string;
  invoicePrefix?: string;
  creditNotePrefix?: string;
  purchaseOrderPrefix?: string;
  depositInvoicePrefix?: string;
  progressInvoicePrefix?: string;
}): string {
  if (settings) {
    const prefixMap: Record<string, string | undefined> = {
      quote: settings.quotePrefix,
      invoice: settings.invoicePrefix,
      credit_note: settings.creditNotePrefix,
      purchase_order: settings.purchaseOrderPrefix,
      deposit_invoice: settings.depositInvoicePrefix,
      progress_invoice: settings.progressInvoicePrefix,
    };
    return prefixMap[type] ?? documentPrefixes[type as keyof typeof documentPrefixes] ?? "DOC";
  }
  return documentPrefixes[type as keyof typeof documentPrefixes] ?? "DOC";
}

export async function getNextSequence(
  ctx: { db: { query: Function; insert: Function; patch: Function } },
  companyId: string,
  prefix: string,
  year: number
): Promise<{ sequenceId: Id<"sequences">; number: string }> {
  const existing = await ctx.db.query("sequences")
    .withIndex("by_company_prefix_year", (q: any) =>
      q.eq("companyId", companyId).eq("prefix", prefix).eq("year", year)
    )
    .unique();

  if (existing) {
    const nextNumber = existing.lastNumber + 1;
    await ctx.db.patch(existing._id, { lastNumber: nextNumber });
    return {
      sequenceId: existing._id as Id<"sequences">,
      number: `${prefix}-${year}-${String(nextNumber).padStart(6, "0")}`,
    };
  }

  const sequenceId = await ctx.db.insert("sequences", {
    companyId,
    prefix,
    year,
    lastNumber: 1,
  });

  return {
    sequenceId: sequenceId as Id<"sequences">,
    number: `${prefix}-${year}-${String(1).padStart(6, "0")}`,
  };
}
