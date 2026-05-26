import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Notification, PaginatedResponse } from '../types';
import apiService from './api.service';

class NotificationsService {
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<Notification>> {
    return apiService.getPaginated<Notification>('/notifications', params);
  }

  async markAsRead(id: string): Promise<Notification> {
    return apiService.patch<Notification>(`/notifications/${id}/read`);
  }

  async markAllAsRead(): Promise<void> {
    return apiService.patch('/notifications/read-all');
  }

  async getUnreadCount(): Promise<number> {
    const response = await apiService.get<{ count: number }>('/notifications/unread-count');
    return response.count;
  }

  async registerPushToken(): Promise<void> {
    const { status: existingStatus } = await ExpoNotifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await ExpoNotifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const tokenData = await ExpoNotifications.getExpoPushTokenAsync();

    await apiService.post('/notifications/push-token', {
      token: tokenData.data,
      platform: Platform.OS,
    });
  }

  configurePushNotifications(): void {
    ExpoNotifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  onNotificationReceived(
    callback: (notification: ExpoNotifications.Notification) => void,
  ): ExpoNotifications.EventSubscription {
    return ExpoNotifications.addNotificationReceivedListener(callback);
  }

  onNotificationResponse(
    callback: (response: ExpoNotifications.NotificationResponse) => void,
  ): ExpoNotifications.EventSubscription {
    return ExpoNotifications.addNotificationResponseReceivedListener(callback);
  }
}

export default new NotificationsService();
