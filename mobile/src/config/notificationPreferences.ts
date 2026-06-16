import AsyncStorage from '@react-native-async-storage/async-storage';

// HU31: el padre puede configurar qué tipos de notificación quiere recibir/ver desde su perfil.
// Las preferencias se guardan localmente (por dispositivo) y se aplican al leer el feed de
// notificaciones — no hay servidor que filtre el envío, así que el filtro ocurre en la lectura.
export const NOTIFICATION_PREFS_KEY = '@vsl/notification_prefs';

export interface NotificationPreferences {
  push: boolean;
  boarding: boolean;
  arrival: boolean;
  deviation: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  push: true,
  boarding: true,
  arrival: true,
  deviation: true,
};

export async function loadNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export async function saveNotificationPreferences(prefs: NotificationPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // si no se puede persistir, el toggle sigue funcionando en memoria por esta sesión
  }
}

// Dado el `type` de una fila de la tabla `notifications`, indica si el padre quiere verla según
// sus preferencias actuales. Tipos sin toggle propio (pagos, sustituto, mensajes generales)
// siempre se muestran mientras el maestro "push" esté activo.
export function isNotificationTypeEnabled(type: string, prefs: NotificationPreferences): boolean {
  if (!prefs.push) return false;
  if (type === 'student_boarded') return prefs.boarding;
  if (type === 'trip_completed') return prefs.arrival;
  if (type === 'route_updated') return prefs.deviation;
  return true;
}
