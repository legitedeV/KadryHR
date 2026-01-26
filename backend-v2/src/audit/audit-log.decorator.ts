import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_METADATA = 'AUDIT_LOG_METADATA';

export interface AuditLogOptions {
  action: string;
  entityType: string;
  entityIdParam?: string;
  captureBody?: boolean;
  fetchBefore?: boolean;
}

export const AuditLog = (options: AuditLogOptions) =>
  SetMetadata(AUDIT_LOG_METADATA, options);
