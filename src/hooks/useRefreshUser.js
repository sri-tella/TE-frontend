import { useEffect } from 'react';
import { authApi, parseUserResponse } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

// Re-fetches the current user's roles/activeRole from the backend on mount,
// so role changes made by an admin show up without a logout+login.
export const useRefreshUser = () => {
  const userId = useAuthStore((state) => state.user?.userId);
  const updateUser = useAuthStore((state) => state.updateUser);

  useEffect(() => {
    if (!userId) return;
    authApi.getUser(userId)
      .then((data) => updateUser(parseUserResponse(data)))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
};
