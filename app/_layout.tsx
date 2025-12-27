import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inLoginGroup = segments[0] === 'login';
    const inRegisterGroup = segments[0] === 'register';
    const inVehiclesGroup = segments[0] === 'vehicles';

    console.log('[Layout] Routing check:', {
      isAuthenticated,
      segments: segments[0],
      inAuthGroup,
      inLoginGroup,
      inRegisterGroup,
      inVehiclesGroup,
    });

    if (!isAuthenticated) {
      // Nếu chưa đăng nhập và không ở trang login/register, chuyển đến login
      if (!inLoginGroup && !inRegisterGroup) {
        console.log('[Layout] Redirecting to login (not authenticated)');
        router.replace('/login');
      }
    } else {
      // Nếu đã đăng nhập và đang ở trang login/register, chuyển đến tabs
      // Nhưng KHÔNG redirect nếu đang ở trang vehicles hoặc các route khác hợp lệ
      if (inLoginGroup || inRegisterGroup) {
        // Chỉ redirect nếu đang ở login/register, không redirect nếu đang ở vehicles
        if (!inVehiclesGroup) {
          console.log('[Layout] Redirecting to tabs (from login/register)');
          router.replace('/(tabs)');
        } else {
          console.log('[Layout] Skipping redirect (on vehicles page)');
        }
      }
      // Không redirect nếu đang ở vehicles hoặc các route khác hợp lệ
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="vehicles" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
