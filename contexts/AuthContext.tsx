import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '@/services/api';

interface User {
  id: number;
  fullName: string;
  email: string;
  roleId: number;
  vehicles?: Array<{
    id: number;
    licensePlate: string;
    vehicleType: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra xem user đã đăng nhập chưa
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Kiểm tra xem có token không
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        // Có token, lấy thông tin user
        // Không throw error nếu getProfile fail để không block app
        try {
          await refreshUser();
        } catch (error: any) {
          // Nếu là lỗi authentication, có thể token đã hết hạn
          // Nhưng không xóa token ở đây vì có thể user đang login
          console.warn('Could not refresh user on startup:', error.message);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Chỉ xóa token nếu chắc chắn là lỗi authentication (401)
      // Không xóa nếu là network error hoặc lỗi khác
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      // Kiểm tra xem có token không trước khi gọi API
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        console.warn('No access token found, cannot fetch profile');
        return;
      }

      const profileData = await authAPI.getProfile();
      setUser({
        id: profileData.id,
        fullName: profileData.fullName,
        email: profileData.email,
        roleId: profileData.roleId,
        vehicles: profileData.vehicles || [],
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      // Không throw error để không block app
      // Chỉ log và giữ nguyên user state hiện tại
      // Nếu user đã có trong state thì không cần update
      if (!user) {
        // Nếu chưa có user và không fetch được, có thể token đã hết hạn
        // Nhưng không xóa token ở đây vì có thể là network issue
      }
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login(email, password);
      
      // Lưu user info (convert id và roleId từ string sang number nếu cần)
      setUser({
        id: typeof response.user.id === 'string' ? parseInt(response.user.id, 10) : response.user.id,
        fullName: response.user.fullName,
        email: response.user.email,
        roleId: typeof response.user.roleId === 'string' ? parseInt(response.user.roleId, 10) : response.user.roleId,
        vehicles: response.user.vehicles || [],
      });
      
      // Đợi một chút để đảm bảo token đã được lưu
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify token is stored
      const storedToken = await AsyncStorage.getItem('access_token');
      if (storedToken) {
        console.log('[AuthContext] Token verified after login');
      } else {
        console.error('[AuthContext] Token not found after login!');
      }
      
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authAPI.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Vẫn xóa user ngay cả khi API call fail
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

