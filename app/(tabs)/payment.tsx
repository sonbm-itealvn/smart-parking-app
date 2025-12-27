import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
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
  const { sessions: completedSessions, isLoading: isLoadingHistory, refetch: refetchHistory } = useParkingSessions('completed');
  const [isProcessingExit, setIsProcessingExit] = useState(false);

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

  const handleExitParking = async () => {
    if (!activeSession) return;

    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn kết thúc phiên đỗ xe?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              setIsProcessingExit(true);
              const result = await parkingSessionAPI.exit(activeSession.id);
              
              Alert.alert(
                'Thành công',
                `Số tiền cần thanh toán: ${formatCurrency(result.feeDetails?.totalFee || result.parkingSession.fee)}`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      refetchActive();
                      refetchHistory();
                      setActiveTab('history');
                    },
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể kết thúc phiên đỗ xe');
            } finally {
              setIsProcessingExit(false);
            }
          },
        },
      ]
    );
  };

  // Prepare current payment data
  const currentPayment = activeSession
    ? {
        amount: null, // Will be calculated when exit
        location: activeSession.parkingSlot.slotNumber,
        startTime: formatDateTime(activeSession.entryTime).time,
        endTime: null,
        date: formatDateTime(activeSession.entryTime).date,
        duration: calculateDuration(activeSession.entryTime, activeSession.exitTime),
        rate: activeSession.parkingSlot.parkingLot.pricePerHour,
        sessionId: activeSession.id,
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

        {(isLoadingActive || isLoadingHistory) ? (
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
                    {/* Current Payment */}
                    <ThemedView style={styles.paymentCard}>
                      <ThemedView style={styles.paymentHeader}>
                        <IconSymbol name="creditcard.fill" size={28} color={PrimaryPurple} />
                        <ThemedText type="subtitle" style={styles.paymentTitle}>
                          Thanh toán hiện tại
                        </ThemedText>
                      </ThemedView>

                      <ThemedView style={styles.amountContainer}>
                        <ThemedText style={styles.amountLabel}>Số tiền sẽ được tính khi kết thúc</ThemedText>
                        <ThemedText type="title" style={styles.amount}>
                          {formatCurrency(currentPayment.amount || 0)}
                        </ThemedText>
                      </ThemedView>

                      <ThemedView style={styles.paymentDetails}>
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
                        style={[styles.payButton, isProcessingExit && styles.payButtonDisabled]}
                        onPress={handleExitParking}
                        disabled={isProcessingExit}>
                        {isProcessingExit ? (
                          <ActivityIndicator size="small" color={White} />
                        ) : (
                          <>
                            <IconSymbol name="arrow.turn.up.right" size={20} color={White} />
                            <ThemedText style={styles.payButtonText}>Kết thúc phiên đỗ xe</ThemedText>
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
});

