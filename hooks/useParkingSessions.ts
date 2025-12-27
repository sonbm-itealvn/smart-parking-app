import { useState, useEffect } from 'react';
import { parkingSessionAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export interface ParkingSession {
  id: number;
  vehicleId: number;
  licensePlate: string;
  parkingSlotId: number;
  entryTime: string;
  exitTime: string | null;
  fee: number | null;
  status: 'active' | 'completed' | 'cancelled';
  vehicle: {
    id: number;
    licensePlate: string;
    vehicleType: string;
    user?: {
      id: number;
      fullName: string;
    };
  };
  parkingSlot: {
    id: number;
    slotNumber?: string;
    slot_code?: string;
    status: string;
    parkingLot: {
      id: number;
      name: string;
      location: string;
      pricePerHour: number;
    };
  };
  payments?: Array<{
    id: number;
    amount: number;
    paymentMethod: string;
    status: string;
    paymentTime: string;
  }>;
}

export function useParkingSessions(status?: 'active' | 'completed' | 'cancelled') {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Chỉ fetch khi đã authenticated và không đang loading auth
    if (!authLoading && isAuthenticated) {
      fetchSessions();
    } else if (!authLoading && !isAuthenticated) {
      // Nếu chưa authenticated, set empty và không loading
      setSessions([]);
      setIsLoading(false);
    }
  }, [status, isAuthenticated, authLoading]);

  const fetchSessions = async () => {
    // Không fetch nếu chưa authenticated
    if (!isAuthenticated) {
      console.warn('[useParkingSessions] Not authenticated, skipping fetch');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = status
        ? await parkingSessionAPI.getAll({ status })
        : await parkingSessionAPI.getAll();
      setSessions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch parking sessions');
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  return { sessions, isLoading: isLoading || authLoading, error, refetch: fetchSessions };
}

export interface CurrentParkingResponse {
  hasActiveParking: boolean;
  currentParking: {
    session: {
      id: number;
      entryTime: string;
      licensePlate: string;
      status: string;
      durationHours: number;
    };
    parkingSlot: {
      id: number;
      slotCode: string;
      status: string;
      coordinates: number[][][]; // [[[x1, y1], [x2, y2], [x3, y3], [x4, y4], [x1, y1]]]
    };
    parkingLot: {
      id: number;
      name: string;
      address: string;
      pricePerHour: number;
    };
    vehicle: {
      id: number;
      licensePlate: string;
      vehicleType: string;
    };
  } | null;
}

export function useActiveParkingSession() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentParking, setCurrentParking] = useState<CurrentParkingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchCurrentParking();
    } else if (!authLoading && !isAuthenticated) {
      setCurrentParking(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const fetchCurrentParking = async () => {
    if (!isAuthenticated) {
      console.warn('[useActiveParkingSession] Not authenticated, skipping fetch');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await parkingSessionAPI.getCurrent();
      setCurrentParking(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch current parking session');
      setCurrentParking({ hasActiveParking: false, currentParking: null });
    } finally {
      setIsLoading(false);
    }
  };

  const activeSession = currentParking?.hasActiveParking && currentParking.currentParking
    ? currentParking.currentParking
    : null;

  return { activeSession, isLoading: isLoading || authLoading, error, refetch: fetchCurrentParking };
}

