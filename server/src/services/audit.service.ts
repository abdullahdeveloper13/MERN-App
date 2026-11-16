import type { Request } from "express";
import { AuditLog } from "../models/AuditLog.js";

interface AuditInput {
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit(input: AuditInput, req?: Request): Promise<void> {
  try {
    await AuditLog.create({
      actor: input.actorId ?? req?.user?.id,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata,
      ipAddress: req?.ip,
      userAgent: req?.headers["user-agent"]?.slice(0, 300)
    });
  } catch {
    // Audit logging must not break the primary operation.
  }
}
