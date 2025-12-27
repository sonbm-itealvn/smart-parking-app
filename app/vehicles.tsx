import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Blue100, Colors, Gray100, Gray50, Gray900, PrimaryBlue, SuccessGreen, White } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { vehicleAPI } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Vehicle {
  id: number;
  licensePlate: string;
  vehicleType: string;
  createdAt: string;
}

export default function VehiclesScreen() {
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle' | 'truck'>('car');
  const [isLoading, setIsLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const router = useRouter();
  const colors = Colors['light'];

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setIsLoadingVehicles(true);
      const data = await vehicleAPI.getAll();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading vehicles:', error);
      const errorMessage = error.message || 'Không thể tải danh sách xe. Vui lòng thử lại.';
      
      // Hiển thị thông báo lỗi cho user
      if (errorMessage.includes('Network')) {
        Alert.alert(
          'Lỗi kết nối',
          'Không thể kết nối đến server. Vui lòng kiểm tra:\n- API server đã chạy chưa?\n- Kết nối mạng có ổn không?',
          [{ text: 'Thử lại', onPress: loadVehicles }, { text: 'OK' }]
        );
      } else if (errorMessage.includes('Authentication')) {
        Alert.alert('Lỗi xác thực', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', [
          {
            text: 'Đăng nhập lại',
            onPress: () => router.replace('/login'),
          },
          { text: 'OK' },
        ]);
      } else {
        Alert.alert('Lỗi', errorMessage);
      }
      
      // Set empty array để hiển thị empty state
      setVehicles([]);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const handleRegister = async () => {
    // Validation
    if (!licensePlate.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập biển số xe');
      return;
    }

    // Basic license plate validation (format: XX-XXXXX or similar)
    // Cho phép nhiều format hơn để linh hoạt
    const licensePlateRegex = /^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$|^[0-9]{2}[A-Z]{1,2}[0-9]{4,5}$/;
    const normalizedPlate = licensePlate.trim().toUpperCase();
    if (!licensePlateRegex.test(normalizedPlate)) {
      Alert.alert('Lỗi', 'Biển số xe không hợp lệ. Ví dụ: 30A-12345 hoặc 30A12345');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[Vehicles] Registering vehicle:', { licensePlate: normalizedPlate, vehicleType });
      
      const result = await vehicleAPI.register({
        licensePlate: normalizedPlate,
        vehicleType,
      });

      console.log('[Vehicles] Vehicle registered:', result);

      Alert.alert('Thành công', 'Đăng ký xe thành công!', [
        {
          text: 'OK',
          onPress: () => {
            setLicensePlate('');
            loadVehicles(); // Reload vehicles list
          },
        },
      ]);
    } catch (error: any) {
      console.error('[Vehicles] Register error:', error);
      console.error('[Vehicles] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      const errorMessage = error.message || 'Đăng ký xe thất bại. Vui lòng thử lại.';
      
      // Hiển thị thông báo lỗi chi tiết hơn
      if (errorMessage.includes('Authentication') || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        Alert.alert('Lỗi xác thực', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', [
          {
            text: 'Đăng nhập lại',
            onPress: () => router.replace('/login'),
          },
          { text: 'OK' },
        ]);
      } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        Alert.alert('Lỗi kết nối', 'Không thể kết nối đến server. Vui lòng kiểm tra:\n- API server đã chạy chưa?\n- Kết nối mạng có ổn không?');
      } else if (errorMessage.includes('409') || errorMessage.includes('tồn tại') || errorMessage.includes('already exists')) {
        Alert.alert('Lỗi', 'Biển số xe này đã được đăng ký. Vui lòng sử dụng biển số khác.');
      } else {
        Alert.alert('Lỗi', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getVehicleTypeLabel = (type: string) => {
    switch (type) {
      case 'car':
        return 'Ô tô';
      case 'motorcycle':
        return 'Xe máy';
      case 'truck':
        return 'Xe tải';
      default:
        return type;
    }
  };

  const getVehicleTypeIcon = (type: string) => {
    switch (type) {
      case 'car':
        return 'car.fill';
      case 'motorcycle':
        return 'bicycle';
      case 'truck':
        return 'truck.box.fill';
      default:
        return 'car.fill';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <ThemedView style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}>
              <IconSymbol name="chevron.left" size={24} color={Gray900} />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.headerTitle}>
              Đăng ký xe
            </ThemedText>
            <ThemedView style={styles.placeholder} />
          </ThemedView>

          {/* Register Form */}
          <ThemedView style={styles.formContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Thông tin xe mới
            </ThemedText>

            <ThemedView style={styles.inputContainer}>
              <ThemedView style={styles.iconWrapper}>
                <IconSymbol name="car.fill" size={22} color={PrimaryBlue} />
              </ThemedView>
              <TextInput
                style={styles.input}
                placeholder="Biển số xe (VD: 30A-12345)"
                placeholderTextColor="#9CA3AF"
                value={licensePlate}
                onChangeText={setLicensePlate}
                autoCapitalize="characters"
                maxLength={12}
              />
            </ThemedView>

            <ThemedView style={styles.typeContainer}>
              <ThemedText style={styles.typeLabel}>Loại xe:</ThemedText>
              <ThemedView style={styles.typeButtons}>
                {(['car', 'motorcycle', 'truck'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      vehicleType === type && styles.typeButtonActive,
                    ]}
                    onPress={() => setVehicleType(type)}>
                    <ThemedText
                      style={[
                        styles.typeButtonText,
                        vehicleType === type && styles.typeButtonTextActive,
                      ]}>
                      {getVehicleTypeLabel(type)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>
            </ThemedView>

            <TouchableOpacity
              style={styles.button}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}>
              <ThemedText style={styles.buttonText}>
                {isLoading ? 'Đang đăng ký...' : 'Đăng ký xe'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* Vehicles List */}
          <ThemedView style={styles.listContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Xe đã đăng ký ({vehicles.length})
            </ThemedText>

            {isLoadingVehicles ? (
              <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PrimaryBlue} />
                <ThemedText style={styles.loadingText}>Đang tải...</ThemedText>
              </ThemedView>
            ) : vehicles.length === 0 ? (
              <ThemedView style={styles.emptyContainer}>
                <IconSymbol name="car.fill" size={60} color={colors.icon} />
                <ThemedText style={styles.emptyText}>
                  Chưa có xe nào được đăng ký
                </ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  Đăng ký xe của bạn ở trên để bắt đầu
                </ThemedText>
              </ThemedView>
            ) : (
              vehicles.map((vehicle) => (
                <ThemedView key={vehicle.id} style={styles.vehicleCard}>
                  <ThemedView style={styles.vehicleLeft}>
                    <ThemedView style={styles.vehicleIconContainer}>
                      <IconSymbol
                        name={getVehicleTypeIcon(vehicle.vehicleType) as any}
                        size={24}
                        color={PrimaryBlue}
                      />
                    </ThemedView>
                    <ThemedView style={styles.vehicleInfo}>
                      <ThemedText type="defaultSemiBold" style={styles.vehiclePlate}>
                        {vehicle.licensePlate}
                      </ThemedText>
                      <ThemedText style={styles.vehicleType}>
                        {getVehicleTypeLabel(vehicle.vehicleType)}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <ThemedView style={styles.vehicleRight}>
                    <ThemedView style={styles.statusBadge}>
                      <IconSymbol name="checkmark.circle.fill" size={16} color={SuccessGreen} />
                      <ThemedText style={styles.statusText}>Đã đăng ký</ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              ))
            )}
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: Gray900,
    fontSize: 24,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  formContainer: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Gray900,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: White,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Gray100,
  },
  iconWrapper: {
    marginRight: 12,
    width: 24,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: Gray900,
  },
  typeContainer: {
    marginBottom: 20,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Gray900,
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: White,
    borderWidth: 2,
    borderColor: Gray100,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: PrimaryBlue,
    backgroundColor: Blue100,
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Gray900,
  },
  typeButtonTextActive: {
    color: PrimaryBlue,
    fontWeight: '600',
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PrimaryBlue,
    shadowColor: PrimaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: White,
    letterSpacing: 0.5,
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 30,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '600',
    color: Gray900,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  vehicleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  vehicleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Blue100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 18,
    fontWeight: '700',
    color: Gray900,
    marginBottom: 4,
  },
  vehicleType: {
    fontSize: 14,
    color: '#6B7280',
  },
  vehicleRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: SuccessGreen,
  },
});

