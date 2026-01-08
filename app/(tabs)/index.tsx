import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, ActivityIndicator, Modal, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, PrimaryBlue, PrimaryPurple, SuccessGreen, WarningOrange, Gray50, Gray100, Gray900, White, Blue100, Purple100, Green100 } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActiveParkingSession, useParkingSessions, ParkingSession } from '@/hooks/useParkingSessions';

export default function HomeScreen() {
  const colors = Colors['light'];
  const router = useRouter();
  const { user } = useAuth();
  const { activeSession, isLoading: isLoadingActive } = useActiveParkingSession();
  const { sessions: activeSessions, isLoading: isLoadingActiveSessions } = useParkingSessions('active');
  const { sessions: completedSessions, isLoading: isLoadingCompleted } = useParkingSessions('completed');
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [stats, setStats] = useState({
    totalParkings: 0,
    totalSpent: 0,
    thisMonth: 0,
  });

  // Calculate stats from completed sessions
  useEffect(() => {
    if (completedSessions) {
      const totalParkings = completedSessions.length;
      const totalSpent = completedSessions.reduce((sum, session) => sum + (session.fee || 0), 0);
      
      // Count this month's parkings
      const now = new Date();
      const thisMonth = completedSessions.filter((session) => {
        const exitDate = session.exitTime ? new Date(session.exitTime) : null;
        return exitDate && exitDate.getMonth() === now.getMonth() && exitDate.getFullYear() === now.getFullYear();
      }).length;

      setStats({
        totalParkings,
        totalSpent,
        thisMonth,
      });
    }
  }, [completedSessions]);

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return { time, date: dateStr };
  };

  // Calculate duration
  const calculateDuration = (entryTime: string, exitTime: string | null) => {
    const entry = new Date(entryTime);
    const exit = exitTime ? new Date(exitTime) : new Date();
    const diffMs = exit.getTime() - entry.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours} giờ ${diffMinutes > 0 ? diffMinutes + ' phút' : ''}`;
    }
    return `${diffMinutes} phút`;
  };

  // Determine which active session to display
  const displayedSession = React.useMemo(() => {
    if (selectedSessionId && activeSessions.length > 0) {
      const found = activeSessions.find((s) => s.id === selectedSessionId);
      if (found) return found;
    }
    if (activeSessions.length > 0) return activeSessions[0];
    if (activeSession) {
      return {
        id: activeSession.session.id,
        vehicleId: activeSession.vehicle.id,
        licensePlate: activeSession.session.licensePlate,
        parkingSlotId: activeSession.parkingSlot.id,
        entryTime: activeSession.session.entryTime,
        exitTime: null,
        fee: null,
        status: 'active' as const,
        vehicle: activeSession.vehicle,
        parkingSlot: {
          id: activeSession.parkingSlot.id,
          slotNumber: activeSession.parkingSlot.slotCode,
          slot_code: activeSession.parkingSlot.slotCode,
          status: activeSession.parkingSlot.status,
          parkingLot: activeSession.parkingLot,
        },
      } as ParkingSession;
    }
    return null;
  }, [selectedSessionId, activeSessions, activeSession]);

  // Set default selection when active sessions change
  useEffect(() => {
    if (activeSessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(activeSessions[0].id);
    } else if (activeSessions.length === 0 && activeSession) {
      setSelectedSessionId(null);
    }
  }, [activeSessions, activeSession, selectedSessionId]);

  const currentParking = displayedSession
    ? {
        isParked: true,
        location: displayedSession.parkingSlot.slotNumber || displayedSession.parkingSlot.slot_code || '',
        startTime: formatDateTime(displayedSession.entryTime).time,
        date: formatDateTime(displayedSession.entryTime).date,
        duration: calculateDuration(displayedSession.entryTime, displayedSession.exitTime),
        sessionId: displayedSession.id,
        licensePlate: displayedSession.licensePlate || displayedSession.vehicle?.licensePlate,
        parkingLotName: displayedSession.parkingSlot.parkingLot.name,
      }
    : {
        isParked: false,
        location: '',
        startTime: '',
        date: '',
        duration: '',
        sessionId: null,
        licensePlate: '',
        parkingLotName: '',
      };

  if (isLoadingActive || isLoadingActiveSessions || isLoadingCompleted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ThemedView style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={PrimaryBlue} />
          <ThemedText style={styles.loadingText}>Đang tải...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemedView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <ThemedView style={styles.header}>
            <ThemedView>
              <ThemedText style={styles.greeting}>Xin chào,</ThemedText>
              <ThemedText type="title" style={styles.userName}>
                {user?.fullName || 'Người dùng'}
              </ThemedText>
            </ThemedView>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.avatarButton}>
              <ThemedView style={styles.avatarContainer}>
                <IconSymbol name="person.circle.fill" size={44} color={PrimaryBlue} />
              </ThemedView>
            </TouchableOpacity>
          </ThemedView>

          {/* Current Parking Status */}
          <ThemedView style={styles.card}>
            <ThemedView style={styles.cardHeader}>
              <IconSymbol name="car.fill" size={24} color={currentParking.isParked ? SuccessGreen : colors.icon} />
              <ThemedText type="subtitle" style={styles.cardTitle}>
                Trạng thái đỗ xe
              </ThemedText>
            </ThemedView>
            {currentParking.isParked ? (
              <>
                {activeSessions.length > 1 && (
                  <ThemedView style={styles.selectorContainer}>
                    <ThemedText style={styles.selectorLabel}>Chọn xe đang đỗ:</ThemedText>
                    <TouchableOpacity
                      style={styles.selectorButton}
                      onPress={() => setShowVehicleSelector(true)}>
                      <ThemedView style={styles.selectorButtonContent}>
                        <IconSymbol name="car.fill" size={20} color={PrimaryBlue} />
                        <ThemedText type="defaultSemiBold" style={styles.selectorButtonText}>
                          {currentParking.licensePlate}
                        </ThemedText>
                        <IconSymbol name="chevron.down" size={18} color="#9CA3AF" />
                      </ThemedView>
                    </TouchableOpacity>
                  </ThemedView>
                )}

                <ThemedView style={styles.parkingInfo}>
                  <ThemedText style={styles.parkingLocation}>{currentParking.location}</ThemedText>
                  <ThemedText style={styles.parkingTime}>
                    Biển số: {currentParking.licensePlate}
                  </ThemedText>
                  <ThemedText style={styles.parkingTime}>
                    Bãi: {currentParking.parkingLotName}
                  </ThemedText>
                  <ThemedText style={styles.parkingTime}>
                    Bắt đầu: {currentParking.startTime} - {currentParking.date}
                  </ThemedText>
                  <ThemedText style={styles.parkingDuration}>Thời gian: {currentParking.duration}</ThemedText>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/(tabs)/location')}
                    activeOpacity={0.8}>
                    <ThemedText style={styles.buttonText}>Xem vị trí</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </>
            ) : (
              <ThemedView style={styles.noParking}>
                <ThemedText style={styles.noParkingText}>Hiện tại không có xe đang đỗ</ThemedText>
              </ThemedView>
            )}
          </ThemedView>

          {/* Quick Stats */}
          <ThemedView style={styles.statsContainer}>
            <ThemedView style={styles.statCard}>
              <ThemedView style={[styles.statIconContainer, { backgroundColor: Blue100 }]}>
                <IconSymbol name="chart.bar.fill" size={24} color={PrimaryBlue} />
              </ThemedView>
              <ThemedText type="subtitle" style={styles.statValue}>
                {stats.totalParkings}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Tổng lượt đỗ</ThemedText>
            </ThemedView>

            <ThemedView style={styles.statCard}>
              <ThemedView style={[styles.statIconContainer, { backgroundColor: '#FED7AA' }]}>
                <IconSymbol name="calendar" size={24} color={WarningOrange} />
              </ThemedView>
              <ThemedText type="subtitle" style={styles.statValue}>
                {stats.thisMonth}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Tháng này</ThemedText>
            </ThemedView>

            <ThemedView style={styles.statCard}>
              <ThemedView style={[styles.statIconContainer, { backgroundColor: Green100 }]}>
                <IconSymbol name="creditcard.fill" size={24} color={SuccessGreen} />
              </ThemedView>
              <ThemedText type="subtitle" style={styles.statValue}>
                {stats.totalSpent.toLocaleString('vi-VN')}đ
              </ThemedText>
              <ThemedText style={styles.statLabel}>Tổng chi tiêu</ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Quick Actions */}
          <ThemedView style={styles.actionsContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Thao tác nhanh
            </ThemedText>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/location')}
              activeOpacity={0.7}>
              <ThemedView style={[styles.actionIconContainer, { backgroundColor: Blue100 }]}>
                <IconSymbol name="location.fill" size={22} color={PrimaryBlue} />
              </ThemedView>
              <ThemedView style={styles.actionContent}>
                <ThemedText type="defaultSemiBold" style={styles.actionTitle}>Vị trí xe đang đỗ</ThemedText>
                <ThemedText style={styles.actionSubtext}>Xem vị trí hiện tại của xe</ThemedText>
              </ThemedView>
              <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/payment')}
              activeOpacity={0.7}>
              <ThemedView style={[styles.actionIconContainer, { backgroundColor: Purple100 }]}>
                <IconSymbol name="creditcard.fill" size={22} color={PrimaryPurple} />
              </ThemedView>
              <ThemedView style={styles.actionContent}>
                <ThemedText type="defaultSemiBold" style={styles.actionTitle}>Thanh toán & Lịch sử</ThemedText>
                <ThemedText style={styles.actionSubtext}>Xem số tiền cần thanh toán và lịch sử</ThemedText>
              </ThemedView>
              <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      </ThemedView>

      {/* Vehicle Selector Modal */}
      <Modal
        visible={showVehicleSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVehicleSelector(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowVehicleSelector(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <ThemedView style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Chọn xe đang đỗ
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowVehicleSelector(false)}
                style={styles.modalCloseButton}>
                <IconSymbol name="xmark.circle.fill" size={24} color={Gray900} />
              </TouchableOpacity>
            </ThemedView>
            <ScrollView style={styles.modalBody}>
              {activeSessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={[
                    styles.modalVehicleItem,
                    selectedSessionId === session.id && styles.modalVehicleItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedSessionId(session.id);
                    setShowVehicleSelector(false);
                  }}>
                  <ThemedView style={styles.modalVehicleLeft}>
                    <ThemedView style={styles.modalVehicleIconContainer}>
                      <IconSymbol name="car.fill" size={20} color={PrimaryBlue} />
                    </ThemedView>
                    <ThemedView>
                      <ThemedText type="defaultSemiBold" style={styles.modalVehiclePlate}>
                        {session.licensePlate || session.vehicle.licensePlate}
                      </ThemedText>
                      <ThemedText style={styles.modalVehicleType}>
                        {session.parkingSlot.parkingLot.name}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  {selectedSessionId === session.id && (
                    <IconSymbol name="checkmark.circle.fill" size={24} color={PrimaryBlue} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Gray50,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  userName: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: '700',
    color: Gray900,
  },
  avatarButton: {
    borderRadius: 22,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Blue100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 20,
    marginTop: 0,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: White,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Gray900,
  },
  parkingInfo: {
    gap: 10,
  },
  parkingLocation: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
    color: Gray900,
  },
  parkingTime: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  parkingDuration: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: PrimaryBlue,
    shadowColor: PrimaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: White,
  },
  noParking: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  noParkingText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: White,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '700',
    color: Gray900,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '600',
    color: Gray900,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: White,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0,
    gap: 16,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Gray900,
    marginBottom: 2,
  },
  actionSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  selectorContainer: {
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Gray900,
    marginBottom: 8,
  },
  selectorButton: {
    backgroundColor: White,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Gray100,
  },
  selectorButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectorButtonText: {
    flex: 1,
    fontSize: 16,
    color: Gray900,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: White,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Gray100,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Gray900,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalVehicleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: Gray50,
    borderWidth: 1,
    borderColor: Gray100,
  },
  modalVehicleItemSelected: {
    backgroundColor: '#E0F2FE',
    borderColor: PrimaryBlue,
    borderWidth: 2,
  },
  modalVehicleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalVehicleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalVehiclePlate: {
    fontSize: 16,
    fontWeight: '600',
    color: Gray900,
    marginBottom: 4,
  },
  modalVehicleType: {
    fontSize: 14,
    color: '#6B7280',
  },
});
