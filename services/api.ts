/**
 * API Service for Smart Parking App
 * Base URL: http://localhost:3000/api
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.0.32:3000/api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Helper function to get stored token
const getStoredToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      console.log('[API] Token found, length:', token.length);
      console.log('[API] Token preview:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('[API] No token found in AsyncStorage');
    }
    return null;
  } catch (error) {
    console.error('[API] Error reading token:', error);
    return null;
  }
};

// Helper function to store tokens
const storeTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    console.log('[API] Tokens stored successfully');
    console.log('[API] Access token length:', accessToken.length);
    console.log('[API] Access token preview:', accessToken.substring(0, 20) + '...');
    
    // Verify tokens were stored
    const storedAccessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const storedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    
    if (storedAccessToken === accessToken && storedRefreshToken === refreshToken) {
      console.log('[API] Token storage verified successfully');
    } else {
      console.warn('[API] Token storage verification failed');
      console.warn('[API] Expected access token length:', accessToken.length);
      console.warn('[API] Stored access token length:', storedAccessToken?.length);
    }
  } catch (error) {
    console.error('[API] Error storing tokens:', error);
  }
};

// Helper function to clear tokens
const clearTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    console.log('[API] Tokens cleared');
  } catch (error) {
    console.error('[API] Error clearing tokens:', error);
  }
};

// Helper function to make API requests
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('[API] Request with token:', endpoint);
  } else {
    console.warn('[API] No token found for request:', endpoint);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    console.warn('[API] 401 Unauthorized for:', endpoint);
    
    // Không cố refresh token cho các endpoint auth (login, register, refresh-token)
    // vì chúng không cần token
    if (endpoint.includes('/auth/login') || 
        endpoint.includes('/auth/register') || 
        endpoint.includes('/auth/refresh-token')) {
      // Đối với các endpoint này, 401 có nghĩa là credentials không đúng
      // Không cần refresh token
      return response;
    }
    
    // Token expired, try to refresh
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

    if (refreshToken) {
      try {
        console.log('[API] Attempting token refresh...');
        const refreshResponse = await fetch(`${BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            await refreshResponse.json();
          await storeTokens(newAccessToken, newRefreshToken);
          headers['Authorization'] = `Bearer ${newAccessToken}`;
          console.log('[API] Token refreshed successfully, retrying request');

          // Retry original request
          return fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
        } else {
          console.error('[API] Token refresh failed with status:', refreshResponse.status);
          await clearTokens();
          throw new Error('Authentication failed. Please login again.');
        }
      } catch (error) {
        console.error('[API] Token refresh error:', error);
        await clearTokens();
        throw new Error('Authentication failed. Please login again.');
      }
    } else {
      console.warn('[API] No refresh token available for protected endpoint:', endpoint);
      // Chỉ clear tokens và throw error nếu đây là protected endpoint
      // Không throw cho auth endpoints
      await clearTokens();
      throw new Error('Authentication failed. Please login again.');
    }
  }

  return response;
};

// Auth APIs
export const authAPI = {
  register: async (data: {
    fullName: string;
    email: string;
    password: string;
    roleId?: number;
  }) => {
    // Register không cần token, nên gọi trực tiếp fetch
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, roleId: data.roleId || 1 }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const result = await response.json();
    if (result.accessToken && result.refreshToken) {
      await storeTokens(result.accessToken, result.refreshToken);
      console.log('[API] Registration successful, tokens stored');
    } else {
      console.error('[API] Register response missing tokens:', result);
    }
    return result;
  },

  login: async (email: string, password: string) => {
    // Login không cần token, nên gọi trực tiếp fetch để tránh vòng lặp
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const result = await response.json();
    console.log('[API] Login response received:', {
      hasAccessToken: !!result.accessToken,
      hasRefreshToken: !!result.refreshToken,
      accessTokenLength: result.accessToken?.length,
    });
    
    if (result.accessToken && result.refreshToken) {
      // Store tokens immediately
      await storeTokens(result.accessToken, result.refreshToken);
      
      // Verify token was stored
      setTimeout(async () => {
        const verifyToken = await getStoredToken();
        if (verifyToken === result.accessToken) {
          console.log('[API] Login successful, tokens stored and verified');
        } else {
          console.warn('[API] Token storage verification failed after login (async check)');
          console.warn('[API] This might be a timing issue, token should still be stored');
        }
      }, 100);
      
      console.log('[API] Login successful, tokens stored');
    } else {
      console.error('[API] Login response missing tokens:', {
        accessToken: result.accessToken ? 'present' : 'missing',
        refreshToken: result.refreshToken ? 'present' : 'missing',
      });
    }
    return result;
  },

  logout: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

      if (refreshToken) {
        try {
          await apiRequest('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          });
        } catch (error) {
          console.error('Logout error:', error);
        }
      }

      await clearTokens();
    } catch (error) {
      console.error('Error during logout:', error);
      await clearTokens();
    }
  },

  getProfile: async () => {
    try {
      const response = await apiRequest('/auth/profile');

      if (!response.ok) {
        // Nếu là 401, token đã hết hạn hoặc không hợp lệ
        if (response.status === 401) {
          await clearTokens();
          throw new Error('Authentication failed. Please login again.');
        }

        const errorText = await response.text();
        let errorMessage = 'Failed to fetch profile';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      // Nếu là network error hoặc fetch failed
      if (error.message && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  },

  refreshToken: async (refreshToken: string) => {
    const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const result = await response.json();
    if (result.accessToken && result.refreshToken) {
      await storeTokens(result.accessToken, result.refreshToken);
    }
    return result;
  },
};

// Vehicle APIs
export const vehicleAPI = {
  register: async (data: { licensePlate: string; vehicleType: string }) => {
    try {
      console.log('[API] Registering vehicle:', data);
      
      const response = await apiRequest('/vehicles', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      console.log('[API] Vehicle register response status:', response.status);

      if (!response.ok) {
        // Nếu là 401, token đã hết hạn
        if (response.status === 401) {
          await clearTokens();
          throw new Error('Authentication failed. Please login again.');
        }

        const errorText = await response.text();
        let errorMessage = 'Failed to register vehicle';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
          console.error('[API] Vehicle register error:', errorJson);
        } catch {
          errorMessage = errorText || errorMessage;
          console.error('[API] Vehicle register error (text):', errorText);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('[API] Vehicle registered successfully:', result);
      return result;
    } catch (error: any) {
      console.error('[API] Vehicle register exception:', error);
      // Nếu là network error
      if (error.message && (error.message.includes('fetch') || error.message.includes('Network'))) {
        throw new Error('Network error. Please check your connection and ensure the API server is running.');
      }
      throw error;
    }
  },

  getAll: async () => {
    try {
      const response = await apiRequest('/vehicles');

      if (!response.ok) {
        // Nếu là 401, token đã hết hạn hoặc không hợp lệ
        if (response.status === 401) {
          clearTokens();
          throw new Error('Authentication failed. Please login again.');
        }

        const errorText = await response.text();
        let errorMessage = 'Failed to fetch vehicles';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      // Nếu là network error hoặc fetch failed
      if (error.message && (error.message.includes('fetch') || error.message.includes('Network'))) {
        throw new Error('Network error. Please check your connection and ensure the API server is running.');
      }
      throw error;
    }
  },
};

// Parking Session APIs
export const parkingSessionAPI = {
  getAll: async (params?: { status?: string; parkingLotId?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.parkingLotId)
      queryParams.append('parkingLotId', params.parkingLotId.toString());

    const queryString = queryParams.toString();
    const endpoint = `/parking-sessions${queryString ? `?${queryString}` : ''}`;

    const response = await apiRequest(endpoint);

    if (!response.ok) {
      throw new Error('Failed to fetch parking sessions');
    }

    return response.json();
  },

  getActive: async () => {
    return parkingSessionAPI.getAll({ status: 'active' });
  },

  getCurrent: async () => {
    const response = await apiRequest('/parking-sessions/my/current');

    if (!response.ok) {
      if (response.status === 404) {
        // No active parking session
        return { hasActiveParking: false, currentParking: null };
      }
      throw new Error('Failed to fetch current parking session');
    }

    return response.json();
  },

  getCompleted: async () => {
    return parkingSessionAPI.getAll({ status: 'completed' });
  },

  exit: async (sessionId: number) => {
    const response = await apiRequest(`/parking-sessions/${sessionId}/exit`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to exit parking');
    }

    return response.json();
  },

  previewFee: async () => {
    const response = await apiRequest('/parking-sessions/my/current/preview-fee');

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Không có phiên đỗ xe đang hoạt động');
      }
      const error = await response.json();
      throw new Error(error.message || 'Failed to preview fee');
    }

    return response.json();
  },
};

// Parking Lot APIs
export const parkingLotAPI = {
  getById: async (id: number) => {
    try {
      const response = await apiRequest(`/parking-lots/${id}`);

      if (!response.ok) {
        if (response.status === 401) {
          await clearTokens();
          throw new Error('Authentication failed. Please login again.');
        }

        const errorText = await response.text();
        let errorMessage = 'Failed to fetch parking lot';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      if (error.message && (error.message.includes('fetch') || error.message.includes('Network'))) {
        throw new Error('Network error. Please check your connection and ensure the API server is running.');
      }
      throw error;
    }
  },
};

// Export token getter for use in other parts of the app
export const getAccessToken = async (): Promise<string | null> => {
  return await getStoredToken();
};

