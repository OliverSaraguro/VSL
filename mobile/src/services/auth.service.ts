import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/api';
import { AuthResponse, User } from '../types';
import apiService from './api.service';

interface LoginPayload {
  email: string;
  password: string;
}

class AuthService {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/login', payload);
    await this.persistToken(response.token);
    return response;
  }

  async registerDriver(payload: Record<string, unknown>): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/register/driver', payload);
    await this.persistToken(response.token);
    return response;
  }

  async registerParent(payload: Record<string, unknown>): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/register/parent', payload);
    await this.persistToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
  }

  async getProfile(): Promise<User> {
    return apiService.get<User>('/auth/profile');
  }

  async getStoredToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  private async persistToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }
}

const authService = new AuthService();
export { authService };
export default authService;
