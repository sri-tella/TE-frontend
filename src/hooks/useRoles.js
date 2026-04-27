import { useAuthStore } from '../store/authStore';

export const useRoles = () => {
  const user = useAuthStore((state) => state.user);
  const roles = Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
  const hasRole = (role) => roles.includes(role);
  const canEdit = hasRole('ADMIN') || !!user?.canEditContent;
  return { roles, hasRole, canEdit };
};
