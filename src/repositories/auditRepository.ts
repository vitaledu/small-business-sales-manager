import prisma from '@/db/client';

export class AuditRepository {
  static async log(action: string, entityType: string, entityId: number, details?: any) {
    return prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        details: details ? JSON.stringify(details) : undefined,
      },
    });
  }

  static async getLog(limit: number = 100, offset: number = 0) {
    return prisma.auditLog.findMany({
      take: limit,
      skip: offset,
      orderBy: { timestamp: 'desc' },
    });
  }

  static async getLogByEntity(entityType: string, entityId: number) {
    return prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { timestamp: 'desc' },
    });
  }
}
