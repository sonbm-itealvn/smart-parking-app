import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Blue100, Colors, Gray100, Gray50, Gray900, PrimaryBlue, White } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  // Force light mode cho login screen
  const colors = Colors['light'];

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(email, password);
      setIsLoading(false);

      if (success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Lỗi', 'Đăng nhập thất bại. Email hoặc mật khẩu không đúng.');
      }
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Lỗi', error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ThemedView style={styles.content}>
        {/* Header với icon đẹp hơn */}
        <ThemedView style={styles.header}>
          <ThemedView style={styles.iconContainer}>
            <IconSymbol name="car.fill" size={70} color={PrimaryBlue} />
          </ThemedView>
          <ThemedText type="title" style={styles.title}>
            Smart Parking
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Đăng nhập để quản lý bãi đỗ xe
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.form}>
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

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}>
            <ThemedText style={styles.buttonText}>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.footer}>
          <ThemedText style={styles.footerText}>
            Chưa có tài khoản?{' '}
          </ThemedText>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <ThemedText style={styles.linkText}>Đăng ký</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Gray50,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
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

