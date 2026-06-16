// Import de solo-tipos: no carga el módulo en tiempo de ejecución, así que no dispara el
// aviso de "removido de Expo Go" mientras nadie llame a las funciones de push de abajo.
// La carga real ocurre de forma diferida (require) dentro de cada método.
import type * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/auth.store';
import { Notification, PaginatedResponse } from '../types';

// El id del usuario logueado ya vive en el store de autenticación. Usarlo en vez de volver a
// pedirlo a Supabase con supabase.auth.getUser() evita un round-trip de red innecesario y el
// deadlock conocido del lock interno de supabase-js en React Native.
function getCurrentUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

// Evita que una llamada a Supabase se quede colgada indefinidamente (p.ej. red inestable del emulador
// o caché de esquema de PostgREST desactualizado tras un alter table)
function withTimeout<T>(promise: PromiseLike<T>, label: string, ms = 15000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Tiempo de espera agotado en "${label}" (revisa tu conexión a internet)`));
    }, ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

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

    const userId = getCurrentUserId();
    if (!userId) throw new Error('No autenticado');

    const { data, error, count } = await withTimeout(
      supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to),
      'cargar notificaciones',
    );

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
    const { data, error } = await withTimeout(
      supabase.from('notifications').update({ is_read: true }).eq('id', id).select().single(),
      'marcar notificación como leída',
    );

    if (error) throw error;
    return mapNotification(data);
  }

  async markAllAsRead(): Promise<void> {
    const userId = getCurrentUserId();
    if (!userId) return;

    const { error } = await withTimeout(
      supabase.from('notifications').update({ is_read: true }).eq('user_id', userId),
      'marcar todas como leídas',
    );

    if (error) throw error;
  }

  // Crea una notificación in-app para un usuario puntual. En Expo Go (sin development build) no
  // hay push remoto real (ver warnOfExpoGoPushUsage), así que esta tabla + el badge del dashboard
  // hacen de "push" mientras se prueba: el padre la ve apenas abre la app o refresca su panel.
  async create(
    userId: string,
    title: string,
    body: string,
    type: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const { error } = await withTimeout(
      supabase.from('notifications').insert({
        user_id: userId,
        title,
        body,
        type,
        data: data ?? null,
      }),
      'crear notificación',
    );
    if (error) console.warn('No se pudo crear la notificación:', error.message);
  }

  // Igual que create() pero para varios destinatarios a la vez (p. ej. todos los padres de una ruta)
  async createMany(
    userIds: string[],
    title: string,
    body: string,
    type: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    if (userIds.length === 0) return;
    const { error } = await withTimeout(
      supabase.from('notifications').insert(
        userIds.map((userId) => ({ user_id: userId, title, body, type, data: data ?? null })),
      ),
      'crear notificaciones',
    );
    if (error) console.warn('No se pudieron crear las notificaciones:', error.message);
  }

  async getUnreadCount(): Promise<number> {
    const userId = getCurrentUserId();
    if (!userId) return 0;

    const { error, count } = await withTimeout(
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false),
      'contar notificaciones no leídas',
    );

    if (error) throw error;
    return count || 0;
  }

  async registerPushToken(): Promise<void> {
    const ExpoNotifications: typeof import('expo-notifications') = require('expo-notifications');

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
    const ExpoNotifications: typeof import('expo-notifications') = require('expo-notifications');

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
    const ExpoNotificationsRuntime: typeof import('expo-notifications') = require('expo-notifications');
    return ExpoNotificationsRuntime.addNotificationReceivedListener(callback);
  }

  onNotificationResponse(
    callback: (response: ExpoNotifications.NotificationResponse) => void,
  ): ExpoNotifications.EventSubscription {
    const ExpoNotificationsRuntime: typeof import('expo-notifications') = require('expo-notifications');
    return ExpoNotificationsRuntime.addNotificationResponseReceivedListener(callback);
  }
}

export default new NotificationsService();
