import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, PrimaryBlue, ErrorRed, Gray50, Gray100, Gray900, White, Blue100 } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function ProfileScreen() {
  const colors = Colors['light'];
  const { user, logout, refreshUser } = useAuth();
  const { profile, isLoading, refetch } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    // Refresh profile when screen loads
    refetch();
  }, []);

  // Note: Profile will refresh when navigating back from vehicles screen
  // This is handled by the vehicles screen calling loadVehicles after registration

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const displayUser = profile || user;
  const primaryVehicle = displayUser?.vehicles && displayUser.vehicles.length > 0 
    ? displayUser.vehicles[0] 
    : null;

  const profileItems = [
    { icon: 'person.fill', label: 'Họ và tên', value: displayUser?.fullName || 'N/A' },
    { icon: 'envelope.fill', label: 'Email', value: displayUser?.email || 'N/A' },
    { icon: 'car.fill', label: 'Biển số xe', value: primaryVehicle?.licensePlate || 'Chưa đăng ký' },
  ];

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemedView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.headerTitle}>Thông tin cá nhân</ThemedText>
          </ThemedView>

          {/* Profile Avatar */}
          <ThemedView style={styles.avatarContainer}>
            <ThemedView style={styles.avatar}>
              <IconSymbol name="person.fill" size={60} color={White} />
            </ThemedView>
            <ThemedText type="subtitle" style={styles.userName}>
              {displayUser?.fullName || 'Người dùng'}
            </ThemedText>
          </ThemedView>

          {/* Profile Information */}
          <ThemedView style={styles.infoContainer}>
            {profileItems.map((item, index) => (
              <ThemedView
                key={index}
                style={styles.infoItem}>
                <ThemedView style={styles.infoItemLeft}>
                  <ThemedView style={styles.infoIconContainer}>
                    <IconSymbol name={item.icon as any} size={22} color={PrimaryBlue} />
                  </ThemedView>
                  <ThemedView style={styles.infoItemContent}>
                    <ThemedText style={styles.infoLabel}>{item.label}</ThemedText>
                    <ThemedText type="defaultSemiBold" style={styles.infoValue}>
                      {item.value}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            ))}
          </ThemedView>

          {/* Vehicles Section */}
          <ThemedView style={styles.vehiclesSection}>
            <ThemedView style={styles.vehiclesHeader}>
              <ThemedText type="subtitle" style={styles.vehiclesTitle}>
                Xe đã đăng ký
              </ThemedText>
              <TouchableOpacity
                onPress={() => router.push('/vehicles')}
                style={styles.addVehicleButton}>
                <IconSymbol name="plus.circle.fill" size={20} color={PrimaryBlue} />
                <ThemedText style={styles.addVehicleText}>Thêm xe</ThemedText>
              </TouchableOpacity>
            </ThemedView>
            {displayUser?.vehicles && displayUser.vehicles.length > 0 ? (
              displayUser.vehicles.map((vehicle) => (
                <ThemedView key={vehicle.id} style={styles.vehicleItem}>
                  <ThemedView style={styles.vehicleItemLeft}>
                    <ThemedView style={[styles.vehicleIconContainer, { backgroundColor: Blue100 }]}>
                      <IconSymbol name="car.fill" size={20} color={PrimaryBlue} />
                    </ThemedView>
                    <ThemedView>
                      <ThemedText type="defaultSemiBold" style={styles.vehiclePlate}>
                        {vehicle.licensePlate}
                      </ThemedText>
                      <ThemedText style={styles.vehicleType}>
                        {vehicle.vehicleType === 'car' ? 'Ô tô' : vehicle.vehicleType === 'motorcycle' ? 'Xe máy' : 'Xe tải'}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              ))
            ) : (
              <ThemedView style={styles.noVehicleContainer}>
                <ThemedText style={styles.noVehicleText}>
                  Chưa có xe nào được đăng ký
                </ThemedText>
                <TouchableOpacity
                  onPress={() => router.push('/vehicles')}
                  style={styles.addVehicleLink}>
                  <ThemedText style={styles.addVehicleLinkText}>
                    Đăng ký xe ngay →
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}
          </ThemedView>

          {/* Actions */}
          <ThemedView style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}>
              <ThemedView style={[styles.actionIconContainer, { backgroundColor: Blue100 }]}>
                <IconSymbol name="pencil" size={20} color={PrimaryBlue} />
              </ThemedView>
              <ThemedText style={styles.actionText}>Chỉnh sửa thông tin</ThemedText>
              <IconSymbol name="chevron.right" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}>
              <ThemedView style={[styles.actionIconContainer, { backgroundColor: Blue100 }]}>
                <IconSymbol name="bell.fill" size={20} color={PrimaryBlue} />
              </ThemedView>
              <ThemedText style={styles.actionText}>Thông báo</ThemedText>
              <IconSymbol name="chevron.right" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}>
              <ThemedView style={[styles.actionIconContainer, { backgroundColor: Blue100 }]}>
                <IconSymbol name="questionmark.circle.fill" size={20} color={PrimaryBlue} />
              </ThemedView>
              <ThemedText style={styles.actionText}>Trợ giúp</ThemedText>
              <IconSymbol name="chevron.right" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </ThemedView>

          {/* Logout Button */}
          <ThemedView style={styles.logoutContainer}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <IconSymbol name="arrow.right.square.fill" size={20} color={White} />
              <ThemedText style={styles.logoutText}>Đăng xuất</ThemedText>
            </TouchableOpacity>
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
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: PrimaryBlue,
    shadowColor: PrimaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: Gray900,
  },
  infoContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoItem: {
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
  infoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Blue100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoItemContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: Gray900,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
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
    gap: 15,
    borderWidth: 0,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Gray900,
  },
  logoutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    backgroundColor: ErrorRed,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: White,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  vehiclesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  vehiclesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehiclesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Gray900,
  },
  addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Blue100,
  },
  addVehicleText: {
    fontSize: 14,
    fontWeight: '600',
    color: PrimaryBlue,
  },
  vehicleItem: {
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
  },
  vehicleItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehiclePlate: {
    fontSize: 16,
    fontWeight: '600',
    color: Gray900,
    marginBottom: 4,
  },
  vehicleType: {
    fontSize: 14,
    color: '#6B7280',
  },
  noVehicleContainer: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: White,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0,
  },
  noVehicleText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  addVehicleLink: {
    paddingVertical: 4,
  },
  addVehicleLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: PrimaryBlue,
  },
});

