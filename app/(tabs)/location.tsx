import React from 'react';
import { StyleSheet, ScrollView, View, Dimensions, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, PrimaryBlue, SuccessGreen, Gray50, Gray100, Gray900, White } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActiveParkingSession } from '@/hooks/useParkingSessions';

const { width } = Dimensions.get('window');

export default function LocationScreen() {
  const colors = Colors['light'];
  const { user } = useAuth();
  const { activeSession, isLoading } = useActiveParkingSession();

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

  // Parse slot number to extract zone and spot
  const parseSlotNumber = (slotNumber: string) => {
    // Format: "A-05" or "A-12"
    const parts = slotNumber.split('-');
    return {
      zone: parts[0] || 'N/A',
      spot: parts[1] || 'N/A',
      full: slotNumber,
    };
  };

  const parkingInfo = activeSession
    ? {
        isParked: true,
        location: activeSession.parkingSlot.slotNumber,
        ...parseSlotNumber(activeSession.parkingSlot.slotNumber),
        floor: 'Tầng 1', // API không có floor info, có thể thêm sau
        startTime: formatDateTime(activeSession.entryTime).time,
        date: formatDateTime(activeSession.entryTime).date,
        duration: calculateDuration(activeSession.entryTime, activeSession.exitTime),
        coordinates: { x: 3, y: 2 }, // Mock coordinates, có thể tính từ slotNumber
      }
    : {
        isParked: false,
        location: '',
        zone: '',
        spot: '',
        floor: '',
        startTime: '',
        date: '',
        duration: '',
        coordinates: { x: -1, y: -1 },
      };

  // Mock parking lot map (6x4 grid)
  const parkingLot = Array.from({ length: 4 }, (_, row) =>
    Array.from({ length: 6 }, (_, col) => ({
      id: `${row}-${col}`,
      occupied: parkingInfo.isParked && row === parkingInfo.coordinates.y && col === parkingInfo.coordinates.x,
      reserved: false,
    }))
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ThemedView style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={PrimaryBlue} />
          <ThemedText style={styles.loadingText}>Đang tải...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!parkingInfo.isParked) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.headerTitle}>Vị trí xe đang đỗ</ThemedText>
          </ThemedView>
          <ThemedView style={styles.emptyContainer}>
            <IconSymbol name="car.fill" size={80} color={colors.icon} />
            <ThemedText type="subtitle" style={styles.emptyText}>
              Hiện tại không có xe đang đỗ
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Bạn chưa có lượt đỗ xe nào đang hoạt động
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemedView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.headerTitle}>Vị trí xe đang đỗ</ThemedText>
          </ThemedView>

          {/* Current Parking Info */}
          <ThemedView style={styles.infoCard}>
            <ThemedView style={styles.infoHeader}>
              <IconSymbol name="location.fill" size={28} color={SuccessGreen} />
              <ThemedText type="subtitle" style={styles.infoTitle}>
                Thông tin đỗ xe
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.infoDetails}>
              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Khu vực:</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.infoValue}>
                  {parkingInfo.zone}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Tầng:</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.infoValue}>
                  {parkingInfo.floor}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Vị trí:</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.infoValue}>
                  {parkingInfo.spot}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Biển số xe:</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.infoValue}>
                  {activeSession?.licensePlate || 'N/A'}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Bắt đầu:</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.infoValue}>
                  {parkingInfo.startTime} - {parkingInfo.date}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Thời gian:</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.infoValue}>
                  {parkingInfo.duration}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* Parking Lot Map */}
          <ThemedView style={styles.mapContainer}>
            <ThemedText type="subtitle" style={styles.mapTitle}>
              Sơ đồ bãi đỗ xe
            </ThemedText>
            <ThemedView style={styles.mapCard}>
              <ThemedView style={styles.map}>
                {parkingLot.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.mapRow}>
                    {row.map((spot) => (
                      <ThemedView
                        key={spot.id}
                        style={[
                          styles.parkingSpot,
                          spot.occupied && { backgroundColor: SuccessGreen },
                          !spot.occupied && { backgroundColor: Gray100, borderColor: '#D1D5DB' },
                        ]}>
                        {spot.occupied && (
                          <IconSymbol name="car.fill" size={20} color={White} />
                        )}
                      </ThemedView>
                    ))}
                  </View>
                ))}
              </ThemedView>
              <ThemedView style={styles.mapLegend}>
                <ThemedView style={styles.legendItem}>
                  <ThemedView style={[styles.legendColor, { backgroundColor: SuccessGreen }]} />
                  <ThemedText style={styles.legendText}>Xe của bạn</ThemedText>
                </ThemedView>
                <ThemedView style={styles.legendItem}>
                  <ThemedView style={[styles.legendColor, { backgroundColor: Gray100, borderColor: '#D1D5DB' }]} />
                  <ThemedText style={styles.legendText}>Trống</ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* Directions */}
          <ThemedView style={styles.directionsCard}>
            <IconSymbol name="arrow.turn.up.right" size={24} color={PrimaryBlue} />
            <ThemedView style={styles.directionsContent}>
              <ThemedText type="defaultSemiBold" style={styles.directionsTitle}>
                Hướng dẫn đường đi
              </ThemedText>
              <ThemedText style={styles.directionsText}>
                Từ cửa vào, đi thẳng 50m, rẽ trái vào khu vực A, xe của bạn đang đỗ ở vị trí 12, tầng 1.
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Gray50,
  },
  header: {
    padding: 20,
    paddingTop: 16,
  },
  headerTitle: {
    color: Gray900,
    fontSize: 28,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 20,
    marginBottom: 10,
    color: Gray900,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#6B7280',
  },
  infoCard: {
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
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Gray900,
  },
  infoDetails: {
    gap: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 16,
    color: Gray900,
    fontWeight: '600',
  },
  mapContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mapTitle: {
    marginBottom: 15,
    fontSize: 18,
    fontWeight: '600',
    color: Gray900,
  },
  mapCard: {
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
  map: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mapRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  parkingSpot: {
    width: (width - 80) / 6 - 8,
    height: (width - 80) / 6 - 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  mapLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 14,
    color: Gray900,
  },
  directionsCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: White,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 0,
    flexDirection: 'row',
    gap: 15,
  },
  directionsContent: {
    flex: 1,
  },
  directionsTitle: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '600',
    color: Gray900,
  },
  directionsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
});

