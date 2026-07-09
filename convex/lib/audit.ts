import { v } from "convex/values";
import { mutation } from "../_generated/server";

export async function createAuditLog(
  ctx: { db: { insert: Function } },
  params: {
    companyId: string;
    entityType: string;
    entityId: string;
    action: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  await ctx.db.insert("auditLogs", {
    companyId: params.companyId,
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    userId: params.userId,
    metadata: params.metadata,
  });
}

export async function createDocumentHistory(
  ctx: { db: { insert: Function } },
  params: {
    companyId: string;
    documentId: string;
    action: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  await ctx.db.insert("documentHistory", {
    companyId: params.companyId,
    documentId: params.documentId,
    action: params.action,
    userId: params.userId,
    metadata: params.metadata,
  });
}
