import { useState, useEffect } from 'react';
import { authAPI } from '@/services/api';

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
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

  return { profile, isLoading, error, refetch: fetchProfile };
}

