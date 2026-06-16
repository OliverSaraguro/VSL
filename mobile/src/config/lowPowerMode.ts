// Clave compartida de AsyncStorage para el modo bajo consumo (HU27). El conductor lo activa en
// su Perfil; ActiveRouteScreen lo lee al iniciar la ruta para reducir el GPS a cada 15 s y
// desactivar las imágenes de mapa.
export const LOW_POWER_MODE_KEY = 'vsl:lowPowerMode';
