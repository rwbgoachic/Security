import { Permissions, Role } from '../permissions';

describe('Permissions', () => {
  const superAdmin = { id: 'super1', role: Role.SUPER_ADMIN };
  const admin = { id: 'admin1', role: Role.ADMIN };
  const user = { id: 'user1', role: Role.USER };

  describe('getCommission', () => {
    it('should return commission rate for super admin', async () => {
      const commission = await Permissions.getCommission(superAdmin);
      expect(commission).toBe(0.25);
    });

    it('should return null for non-super admin users', async () => {
      const adminCommission = await Permissions.getCommission(admin);
      const userCommission = await Permissions.getCommission(user);
      
      expect(adminCommission).toBeNull();
      expect(userCommission).toBeNull();
    });
  });

  describe('canAccessResource', () => {
    it('should grant access to super admin for all resources', async () => {
      const canAccess = await Permissions.canAccessResource(superAdmin, 'commission');
      expect(canAccess).toBe(true);
    });

    it('should deny commission access to admin', async () => {
      const canAccess = await Permissions.canAccessResource(admin, 'commission');
      expect(canAccess).toBe(false);
    });

    it('should deny access to regular users', async () => {
      const canAccess = await Permissions.canAccessResource(user, 'any-resource');
      expect(canAccess).toBe(false);
    });
  });
});