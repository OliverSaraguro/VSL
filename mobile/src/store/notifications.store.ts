import { create } from 'zustand';
import { Notification } from '../types';
import notificationsService from '../servicios/notifications.service';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await notificationsService.getAll();
      set({ notifications: response.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationsService.getUnreadCount();
      set({ unreadCount: count });
    } catch {
      /* silent fail */
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationsService.markAsRead(id);
      const { notifications, unreadCount } = get();
      set({
        notifications: notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, unreadCount - 1),
      });
    } catch {
      /* silent fail */
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsService.markAllAsRead();
      const { notifications } = get();
      set({
        notifications: notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      });
    } catch {
      /* silent fail */
    }
  },

  addNotification: (notification) => {
    const { notifications, unreadCount } = get();
    set({
      notifications: [notification, ...notifications],
      unreadCount: notification.isRead ? unreadCount : unreadCount + 1,
    });
  },
}));
