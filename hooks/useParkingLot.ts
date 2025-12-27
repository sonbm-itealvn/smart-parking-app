import { useState, useEffect } from 'react';
import { parkingLotAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export interface ParkingLot {
  id: number;
  name: string;
  location: string;
  pricePerHour: number;
  map: string; // Image URL
  slots?: Array<{
    id: number;
    slotNumber: string;
    status: string;
    coordinates?: {
      x: number;
      y: number;
    };
  }>;
}

export function useParkingLot(id: number | null) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [parkingLot, setParkingLot] = useState<ParkingLot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated && id) {
      fetchParkingLot();
    } else if (!authLoading && !isAuthenticated) {
      setParkingLot(null);
      setIsLoading(false);
    } else if (!id) {
      setParkingLot(null);
      setIsLoading(false);
    }
  }, [id, isAuthenticated, authLoading]);

  const fetchParkingLot = async () => {
    if (!id || !isAuthenticated) {
      console.warn('[useParkingLot] Not authenticated or no ID, skipping fetch');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await parkingLotAPI.getById(id);
      setParkingLot(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch parking lot');
      setParkingLot(null);
    } finally {
      setIsLoading(false);
    }
  };

  return { parkingLot, isLoading: isLoading || authLoading, error, refetch: fetchParkingLot };
}

