import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { authApi, parseUserResponse } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const loginStore = useAuthStore((state) => state.login);
  const logoutStore = useAuthStore((state) => state.logout);

  const loginMutation = useMutation({
    mutationFn: (credentials) => authApi.login(credentials),
    onSuccess: (data) => {
      const token = data.token || data.accessToken || data.jwt || null;
      loginStore(parseUserResponse(data), token);
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
