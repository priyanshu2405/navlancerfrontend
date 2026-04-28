import AuditLog from "../models/auditLog.model.js";

export const createAuditLog = async (
  userId,
  action,
  entityType,
  entityId,
  details
) => {
  await AuditLog.create({
    userId,
    action,
    entityType,
    entityId,
    details,
  });
};
