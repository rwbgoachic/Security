import { AuditLogger } from '../services/audit-logger';

export enum Role {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

interface User {
  id: string;
  role: Role;
}

export class Permissions {
  private static async logAccess(user: User, resource: string, granted: boolean): Promise<void> {
    await AuditLogger.log(
      'permission-check',
      user.id,
      {
        resource,
        granted,
        role: user.role
      },
      granted ? 'info' : 'warning'
    );
  }

  static async getCommission(user: User): Promise<number | null> {
    const hasAccess = user.role === Role.SUPER_ADMIN;
    await this.logAccess(user, 'commission', hasAccess);
    
    if (!hasAccess) {
      return null;
    }

    // Super admin only commission calculation
    return 0.25; // 25% commission rate
  }

  static async canAccessResource(user: User, resource: string): Promise<boolean> {
    const hasAccess = user.role === Role.SUPER_ADMIN || 
                     (user.role === Role.ADMIN && resource !== 'commission');
                     
    await this.logAccess(user, resource, hasAccess);
    return hasAccess;
  }
}