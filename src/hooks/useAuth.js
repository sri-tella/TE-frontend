import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const loginStore = useAuthStore((state) => state.login);
  const logoutStore = useAuthStore((state) => state.logout);

  const loginMutation = useMutation({
    mutationFn: (credentials) => authApi.login(credentials),
    onSuccess: (data) => {
      const token = data.token || data.accessToken || data.jwt || null;

      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        roles: data.roles ? data.roles.replace(/[\[\]]/g, '').split(', ') : [],
        instructorId: data.instructorId,
        observerId: data.observerId,
        userId: data.userId,
        canEditContent: data.canEditContent === 'true',
        activeRole: data.activeRole || null,
      };

      loginStore(userData, token);
      toast.success('Successfully logged in!');
    },
    onError: (error) => {
      toast.error(error.message || 'Login failed');
    },
  });

  return {
    login: loginMutation.mutate,
    isLoading: loginMutation.isPending,
    error: loginMutation.error,
    logout: logoutStore,
  };
};
