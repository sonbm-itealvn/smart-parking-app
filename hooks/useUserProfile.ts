import { useState, useEffect } from 'react';
import { authAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  roleId: number;
  role: {
    id: number;
    name: string;
  };
  createdAt: string;
  vehicles: Array<{
    id: number;
    licensePlate: string;
    vehicleType: string;
    createdAt: string;
  }>;
  notifications: any[];
}

export function useUserProfile() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Chỉ fetch khi đã authenticated và không đang loading auth
    if (!authLoading && isAuthenticated) {
      fetchProfile();
    } else if (!authLoading && !isAuthenticated) {
      // Nếu chưa authenticated, set null và không loading
      setProfile(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const fetchProfile = async () => {
    // Không fetch nếu chưa authenticated
    if (!isAuthenticated) {
      console.warn('[useUserProfile] Not authenticated, skipping fetch');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await authAPI.getProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profile');
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  return { profile, isLoading: isLoading || authLoading, error, refetch: fetchProfile };
}

