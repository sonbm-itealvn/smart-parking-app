import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, ActivityIndicator, Alert, Modal, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, PrimaryBlue, PrimaryPurple, SuccessGreen, Gray50, Gray100, Gray900, White, Blue100, Purple100 } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActiveParkingSession, useParkingSessions, ParkingSession } from '@/hooks/useParkingSessions';
import { parkingSessionAPI } from '@/services/api';

export default function PaymentScreen() {
  const colors = Colors['light'];
  const [activeTab, setActiveTab] = useState<'payment' | 'history'>('payment');
  const { activeSession, isLoading: isLoadingActive, refetch: refetchActive } = useActiveParkingSession();
  const { sessions: activeSessions, isLoading: isLoadingActiveSessions } = useParkingSessions('active');
  const { sessions: completedSessions, isLoading: isLoadingHistory, refetch: refetchHistory } = useParkingSessions('completed');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [feePreview, setFeePreview] = useState<any>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);

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

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '0đ';
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  // Determine which session to display
  const displayedSession = React.useMemo(() => {
    // If we have a selected session ID and active sessions, use the selected one
    if (selectedSessionId && activeSessions.length > 0) {
      const found = activeSessions.find(s => s.id === selectedSessionId);
      if (found) return found;
    }
    
    // If we have active sessions, use the first one (or selected if available)
    if (activeSessions.length > 0) {
      return activeSessions[0];
    }
    
    // Fallback: convert activeSession to ParkingSession format if available
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

  // Set initial selected session when active sessions load
  useEffect(() => {
    if (activeSessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(activeSessions[0].id);
    } else if (activeSessions.length === 0 && activeSession) {
      // If no active sessions from API but we have activeSession, clear selection
      setSelectedSessionId(null);
    }
  }, [activeSessions, activeSession]);

  const handlePreviewFee = async () => {
    try {
      setIsLoadingPreview(true);
      // Preview fee only works for current session, so we'll try it
      // If it fails for non-current sessions, we'll show a message
      const result = await parkingSessionAPI.previewFee();
      setFeePreview(result);
    } catch (error: any) {
      // If preview fails, it might be because the selected session is not the current one
      if (error.message && error.message.includes('Không có phiên đỗ xe đang hoạt động')) {
        Alert.alert('Thông báo', 'Chức năng xem trước tiền chỉ khả dụng cho phiên đỗ xe hiện tại. Vui lòng chọn phiên đỗ xe hiện tại để xem trước tiền.');
      } else {
        Alert.alert('Lỗi', error.message || 'Không thể xem trước tiền đỗ xe');
      }
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Prepare current payment data
  const currentPayment = displayedSession
    ? {
        amount: feePreview?.feePreview?.estimatedFee || null,
        location: displayedSession.parkingSlot.slotNumber || displayedSession.parkingSlot.slot_code || '',
        startTime: formatDateTime(displayedSession.entryTime).time,
        endTime: null,
        date: formatDateTime(displayedSession.entryTime).date,
        duration: calculateDuration(displayedSession.entryTime, null),
        rate: displayedSession.parkingSlot.parkingLot.pricePerHour,
        sessionId: displayedSession.id,
        licensePlate: displayedSession.licensePlate || displayedSession.vehicle.licensePlate,
      }
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>Thanh toán & Lịch sử</ThemedText>
        </ThemedView>

        {/* Tabs */}
        <ThemedView style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'payment' && { backgroundColor: PrimaryBlue },
              activeTab !== 'payment' && { backgroundColor: White, borderColor: Gray100 },
            ]}
            onPress={() => setActiveTab('payment')}>
            <ThemedText
              style={[
                styles.tabText,
                activeTab === 'payment' && { color: White },
                activeTab !== 'payment' && { color: Gray900 },
              ]}>
              Thanh toán
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'history' && { backgroundColor: PrimaryBlue },
              activeTab !== 'history' && { backgroundColor: White, borderColor: Gray100 },
            ]}
            onPress={() => setActiveTab('history')}>
            <ThemedText
              style={[
                styles.tabText,
                activeTab === 'history' && { color: White },
                activeTab !== 'history' && { color: Gray900 },
              ]}>
              Lịch sử
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {(isLoadingActive || isLoadingHistory || isLoadingActiveSessions) ? (
          <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PrimaryBlue} />
            <ThemedText style={styles.loadingText}>Đang tải...</ThemedText>
          </ThemedView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {activeTab === 'payment' ? (
              <ThemedView style={styles.content}>
                {currentPayment ? (
                  <>
                    {/* Vehicle Selector - Show if multiple active sessions */}
                    {activeSessions.length > 1 && (
                      <ThemedView style={styles.selectorContainer}>
                        <ThemedText style={styles.selectorLabel}>Chọn biển số xe:</ThemedText>
                        <TouchableOpacity
                          style={styles.selectorButton}
                          onPress={() => setShowVehicleSelector(true)}>
                          <ThemedView style={styles.selectorButtonContent}>
                            <IconSymbol name="car.fill" size={20} color={PrimaryBlue} />
                            <ThemedText type="defaultSemiBold" style={styles.selectorButtonText}>
                              {currentPayment.licensePlate}
                            </ThemedText>
                            <IconSymbol name="chevron.down" size={18} color="#9CA3AF" />
                          </ThemedView>
                        </TouchableOpacity>
                      </ThemedView>
                    )}

                    {/* Current Payment */}
                    <ThemedView style={styles.paymentCard}>
                      <ThemedView style={styles.paymentHeader}>
                        <IconSymbol name="creditcard.fill" size={28} color={PrimaryPurple} />
                        <ThemedText type="subtitle" style={styles.paymentTitle}>
                          Thanh toán hiện tại
                        </ThemedText>
                      </ThemedView>

                      <ThemedView style={styles.amountContainer}>
                        <ThemedText style={styles.amountLabel}>
                          {feePreview ? 'Ước tính tiền đỗ xe' : 'Số tiền sẽ được tính khi kết thúc'}
                        </ThemedText>
                        <ThemedText type="title" style={styles.amount}>
                          {formatCurrency(currentPayment.amount || 0)}
                        </ThemedText>
                        {feePreview?.feePreview?.note && (
                          <ThemedText style={styles.noteText}>
                            {feePreview.feePreview.note}
                          </ThemedText>
                        )}
                      </ThemedView>

                      <ThemedView style={styles.paymentDetails}>
                        {activeSessions.length > 1 && (
                          <ThemedView style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Biển số xe:</ThemedText>
                            <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                              {currentPayment.licensePlate}
                            </ThemedText>
                          </ThemedView>
                        )}
                        <ThemedView style={styles.detailRow}>
                          <ThemedText style={styles.detailLabel}>Vị trí đỗ:</ThemedText>
                          <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                            {currentPayment.location}
                          </ThemedText>
                        </ThemedView>
                        <ThemedView style={styles.detailRow}>
                          <ThemedText style={styles.detailLabel}>Thời gian bắt đầu:</ThemedText>
                          <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                            {currentPayment.startTime}
                          </ThemedText>
                        </ThemedView>
                        <ThemedView style={styles.detailRow}>
                          <ThemedText style={styles.detailLabel}>Ngày:</ThemedText>
                          <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                            {currentPayment.date}
                          </ThemedText>
                        </ThemedView>
                        <ThemedView style={styles.detailRow}>
                          <ThemedText style={styles.detailLabel}>Thời lượng:</ThemedText>
                          <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                            {currentPayment.duration}
                          </ThemedText>
                        </ThemedView>
                        <ThemedView style={styles.detailRow}>
                          <ThemedText style={styles.detailLabel}>Đơn giá:</ThemedText>
                          <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                            {formatCurrency(currentPayment.rate)}/giờ
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>

                      <TouchableOpacity
                        style={[styles.payButton, isLoadingPreview && styles.payButtonDisabled]}
                        onPress={handlePreviewFee}
                        disabled={isLoadingPreview}>
                        {isLoadingPreview ? (
                          <ActivityIndicator size="small" color={White} />
                        ) : (
                          <>
                            <IconSymbol name="eye.fill" size={20} color={White} />
                            <ThemedText style={styles.payButtonText}>Xem trước tiền đỗ xe</ThemedText>
                          </>
                        )}
                      </TouchableOpacity>
                    </ThemedView>
                  </>
                ) : (
                  <ThemedView style={styles.emptyContainer}>
                    <IconSymbol name="creditcard.fill" size={80} color={colors.icon} />
                    <ThemedText type="subtitle" style={styles.emptyText}>
                      Không có phiên đỗ xe đang hoạt động
                    </ThemedText>
                    <ThemedText style={styles.emptySubtext}>
                      Bạn chưa có lượt đỗ xe nào cần thanh toán
                    </ThemedText>
                  </ThemedView>
                )}

              {/* Payment Methods */}
              <ThemedView style={styles.methodsContainer}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Phương thức thanh toán
                </ThemedText>
                <ThemedView style={styles.methodCard}>
                  <IconSymbol name="creditcard.fill" size={24} color={PrimaryBlue} />
                  <ThemedText style={styles.methodText}>Thẻ tín dụng/Ghi nợ</ThemedText>
                  <IconSymbol name="chevron.right" size={18} color="#9CA3AF" />
                </ThemedView>
                <ThemedView style={styles.methodCard}>
                  <IconSymbol name="qrcode" size={24} color={PrimaryPurple} />
                  <ThemedText style={styles.methodText}>Ví điện tử (MoMo, ZaloPay)</ThemedText>
                  <IconSymbol name="chevron.right" size={18} color="#9CA3AF" />
                </ThemedView>
              </ThemedView>
            </ThemedView>
            ) : (
              <ThemedView style={styles.content}>
                <ThemedText type="subtitle" style={styles.historyTitle}>
                  Lịch sử đỗ xe
                </ThemedText>
                {completedSessions && completedSessions.length > 0 ? (
                  completedSessions.map((session) => {
                    const entryTime = formatDateTime(session.entryTime);
                    const exitTime = session.exitTime ? formatDateTime(session.exitTime) : null;
                    const duration = calculateDuration(session.entryTime, session.exitTime);
                    const isPaid = session.payments && session.payments.length > 0 && 
                      session.payments.some(p => p.status === 'completed');

                    return (
                      <ThemedView key={session.id} style={styles.historyCard}>
                        <ThemedView style={styles.historyHeader}>
                          <ThemedView style={styles.historyLeft}>
                            <IconSymbol name="car.fill" size={24} color={PrimaryBlue} />
                            <ThemedView style={styles.historyInfo}>
                              <ThemedText type="defaultSemiBold" style={styles.historyLocation}>
                                {session.parkingSlot.slotNumber}
                              </ThemedText>
                              <ThemedText style={styles.historyDate}>
                                {exitTime ? exitTime.date : entryTime.date}
                              </ThemedText>
                            </ThemedView>
                          </ThemedView>
                          <ThemedView style={styles.historyRight}>
                            <ThemedText type="defaultSemiBold" style={styles.historyAmount}>
                              {formatCurrency(session.fee)}
                            </ThemedText>
                            <ThemedView style={styles.statusBadge}>
                              <ThemedText style={styles.statusText}>
                                {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                              </ThemedText>
                            </ThemedView>
                          </ThemedView>
                        </ThemedView>
                        <ThemedView style={styles.historyDetails}>
                          <ThemedText style={styles.historyDetailText}>
                            {entryTime.time} - {exitTime ? exitTime.time : 'N/A'} ({duration})
                          </ThemedText>
                          <ThemedText style={styles.historyDetailText}>
                            {session.parkingSlot.parkingLot.name}
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>
                    );
                  })
                ) : (
                  <ThemedView style={styles.emptyContainer}>
                    <IconSymbol name="car.fill" size={80} color={colors.icon} />
                    <ThemedText type="subtitle" style={styles.emptyText}>
                      Chưa có lịch sử đỗ xe
                    </ThemedText>
                    <ThemedText style={styles.emptySubtext}>
                      Lịch sử đỗ xe của bạn sẽ hiển thị ở đây
                    </ThemedText>
                  </ThemedView>
                )}
              </ThemedView>
            )}
          </ScrollView>
        )}

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
                  Chọn biển số xe
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
                      selectedSessionId === session.id && styles.modalVehicleItemSelected
                    ]}
                    onPress={() => {
                      setSelectedSessionId(session.id);
                      setFeePreview(null); // Reset fee preview when changing session
                      setShowVehicleSelector(false);
                    }}>
                    <ThemedView style={styles.modalVehicleLeft}>
                      <ThemedView style={[styles.modalVehicleIconContainer, { backgroundColor: Blue100 }]}>
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  paymentCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: White,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 0,
    marginBottom: 20,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Gray900,
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Gray100,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
    color: PrimaryPurple,
  },
  paymentDetails: {
    gap: 12,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Gray900,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
    backgroundColor: PrimaryPurple,
    shadowColor: PrimaryPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: White,
  },
  methodsContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    marginBottom: 15,
    fontSize: 18,
    fontWeight: '600',
    color: Gray900,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: White,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0,
    gap: 15,
  },
  methodText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Gray900,
  },
  historyTitle: {
    marginBottom: 15,
    fontSize: 18,
    fontWeight: '600',
    color: Gray900,
  },
  historyCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: White,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  historyInfo: {
    flex: 1,
  },
  historyLocation: {
    fontSize: 16,
    marginBottom: 4,
    color: Gray900,
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 16,
    marginBottom: 6,
    color: PrimaryPurple,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: SuccessGreen + '20',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: SuccessGreen,
  },
  historyDetails: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Gray100,
  },
  historyDetailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 20,
    marginBottom: 10,
    color: Gray900,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  noteText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  selectorContainer: {
    marginBottom: 16,
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
    padding: 16,
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
    gap: 12,
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
    fontWeight: '600',
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
    backgroundColor: Blue100,
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

