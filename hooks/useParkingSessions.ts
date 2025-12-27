import { useState, useEffect } from 'react';
import { parkingSessionAPI } from '@/services/api';

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
    slotNumber: string;
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
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [status]);

  const fetchSessions = async () => {
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

  return { sessions, isLoading, error, refetch: fetchSessions };
}

export function useActiveParkingSession() {
  const { sessions, isLoading, error, refetch } = useParkingSessions('active');
  const activeSession = sessions.length > 0 ? sessions[0] : null;
  return { activeSession, isLoading, error, refetch };
}

