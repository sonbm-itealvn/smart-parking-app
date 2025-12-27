import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Blue100, Colors, Gray100, Gray50, Gray900, PrimaryBlue, White } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { authAPI } from '@/services/api';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, refreshUser } = useAuth();
  const router = useRouter();
  const colors = Colors['light'];

  const handleRegister = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      // Call register API
      const result = await authAPI.register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        roleId: 1, // USER role
      });

      // Token đã được lưu trong authAPI.register()
      // Đợi một chút để đảm bảo token đã được lưu xong trước khi gọi getProfile
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Sau đó refresh user profile
      try {
        await refreshUser();
      } catch (profileError: any) {
        // Nếu không fetch được profile, vẫn cho phép đăng ký thành công
        // vì token đã được lưu và user có thể đăng nhập lại
        console.warn('Could not fetch profile after registration:', profileError);
        // Có thể dùng user data từ register response nếu có
        if (result.user) {
          // Set user từ register response nếu getProfile fail
          // Note: refreshUser sẽ được gọi lại khi app check auth status
        }
      }

      setIsLoading(false);
      Alert.alert('Thành công', 'Đăng ký thành công!', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/(tabs)');
          },
        },
      ]);
    } catch (error: any) {
      setIsLoading(false);
      const errorMessage = error.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      
      if (errorMessage.includes('409') || errorMessage.includes('tồn tại')) {
        Alert.alert('Lỗi', 'Email này đã được sử dụng. Vui lòng chọn email khác.');
      } else {
        Alert.alert('Lỗi', errorMessage);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.content}>
          {/* Header */}
          <ThemedView style={styles.header}>
            <ThemedView style={styles.iconContainer}>
              <IconSymbol name="car.fill" size={70} color={PrimaryBlue} />
            </ThemedView>
            <ThemedText type="title" style={styles.title}>
              Đăng ký
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Tạo tài khoản mới để sử dụng Smart Parking
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.form}>
            <ThemedView style={styles.inputContainer}>
              <ThemedView style={styles.iconWrapper}>
                <IconSymbol name="person.fill" size={22} color={PrimaryBlue} />
              </ThemedView>
              <TextInput
                style={styles.input}
                placeholder="Họ và tên"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </ThemedView>

            <ThemedView style={styles.inputContainer}>
              <ThemedView style={styles.iconWrapper}>
                <IconSymbol name="envelope.fill" size={22} color={PrimaryBlue} />
              </ThemedView>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </ThemedView>

            <ThemedView style={styles.inputContainer}>
              <ThemedView style={styles.iconWrapper}>
                <IconSymbol name="lock.fill" size={22} color={PrimaryBlue} />
              </ThemedView>
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </ThemedView>

            <ThemedView style={styles.inputContainer}>
              <ThemedView style={styles.iconWrapper}>
                <IconSymbol name="lock.fill" size={22} color={PrimaryBlue} />
              </ThemedView>
              <TextInput
                style={styles.input}
                placeholder="Xác nhận mật khẩu"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </ThemedView>

            <TouchableOpacity
              style={styles.button}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}>
              <ThemedText style={styles.buttonText}>
                {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ThemedView style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Đã có tài khoản?{' '}
            </ThemedText>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <ThemedText style={styles.linkText}>Đăng nhập</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Gray50,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Blue100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: PrimaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    marginBottom: 8,
    color: Gray900,
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 15,
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
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
    fontSize: 17,
    fontWeight: '600',
    color: White,
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  linkText: {
    fontSize: 14,
    color: PrimaryBlue,
    fontWeight: '600',
  },
});

