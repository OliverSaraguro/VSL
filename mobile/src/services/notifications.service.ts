import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';
import { Notification, PaginatedResponse } from '../types';

function mapNotification(db: any): Notification {
  return {
    id: db.id,
    userId: db.user_id,
    title: db.title,
    body: db.body,
    type: db.type,
    data: db.data,
    isRead: db.is_read,
    createdAt: db.created_at,
  };
}

class NotificationsService {
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<Notification>> {
    const limit = (params?.limit as number) || 10;
    const page = (params?.page as number) || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const items = (data || []).map(mapNotification);
    const total = count || 0;

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markAsRead(id: string): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapNotification(data);
  }

  async markAllAsRead(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id);

    if (error) throw error;
  }

  async getUnreadCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
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

    // Guardar el token en los metadatos de Supabase Auth
    const { error } = await supabase.auth.updateUser({
      data: {
        pushToken: tokenData.data,
        devicePlatform: Platform.OS,
      },
    });

    if (error) {
      console.warn('No se pudo registrar el token push en Supabase:', error.message);
    }
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
