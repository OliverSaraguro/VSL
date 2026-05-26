# VSL – Vehículos Seguros Loja

Aplicación móvil para la gestión integral de transporte escolar en la ciudad de Loja, Ecuador.

## Descripción

VSL conecta a **conductores escolares** y **padres de familia** en una plataforma que permite:

- Registro y autenticación segura con roles diferenciados
- Creación y gestión de rutas con paradas ordenadas
- Rastreo en tiempo real de la buseta vía GPS
- Registro de abordaje con un solo toque
- Notificaciones push automáticas (abordaje, llegada, desvíos, retrasos)
- Registro de ausencias por parte del padre
- Historial de recorridos de los últimos 90 días
- Alertas de cierres viales y rutas alternativas
- Gestión de cobros mensuales
- Delegación a conductor sustituto
- Modo bajo consumo y funcionamiento offline
- Mensajería estructurada (reemplaza WhatsApp)

## Arquitectura

```
proyectoFinal/
├── backend/          → API REST + WebSockets (Node.js + Express + Prisma)
├── mobile/           → App móvil (React Native + Expo)
└── README.md         → Este archivo
```

### Backend

| Tecnología       | Propósito                          |
|------------------|------------------------------------|
| Node.js          | Runtime del servidor               |
| Express          | Framework HTTP                     |
| TypeScript       | Tipado estricto                    |
| Prisma           | ORM con migraciones                |
| PostgreSQL       | Base de datos relacional           |
| Socket.io        | Comunicación en tiempo real (GPS)  |
| Firebase Admin   | Notificaciones push                |
| Zod              | Validación de datos                |
| JWT              | Autenticación stateless            |

### Mobile

| Tecnología          | Propósito                        |
|---------------------|----------------------------------|
| React Native        | Framework multiplataforma        |
| Expo                | Toolchain y build                |
| TypeScript          | Tipado estricto                  |
| Zustand             | Estado global                    |
| React Navigation    | Navegación entre pantallas       |
| react-native-maps   | Mapas y rastreo                  |
| expo-location       | GPS del dispositivo              |
| expo-notifications  | Push notifications               |
| Axios               | Cliente HTTP                     |

## Requisitos Previos

- Node.js >= 18
- PostgreSQL >= 14
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (para emulador) o dispositivo físico con Expo Go

## Instalación

### Backend

```bash
cd backend
npm install
cp .env.example .env          # Configurar variables de entorno
npx prisma migrate dev        # Crear tablas en la base de datos
npx prisma generate           # Generar el cliente Prisma
npm run dev                   # Iniciar en modo desarrollo
```

### Mobile

```bash
cd mobile
npm install
npx expo start                # Iniciar Expo dev server
```

## Variables de Entorno (Backend)

Ver archivo `backend/.env.example` para la lista completa de variables necesarias.

## Estructura del Backend

```
backend/src/
├── config/              → Configuración (DB, environment)
├── modules/
│   ├── auth/            → Registro, login, tokens
│   ├── routes/          → CRUD de rutas y paradas
│   ├── students/        → Gestión de estudiantes
│   ├── tracking/        → GPS en tiempo real, trips
│   ├── notifications/   → Push notifications
│   └── payments/        → Cobros mensuales
├── shared/
│   ├── middleware/      → Auth, validación, errores
│   ├── utils/           → Helpers (token, password, response)
│   └── types/           → Tipos compartidos
├── app.ts               → Configuración de Express
└── server.ts            → Punto de entrada
```

## Estructura del Mobile

```
mobile/src/
├── config/              → API, tema visual
├── types/               → Interfaces TypeScript
├── services/            → Comunicación con el backend
├── store/               → Estado global (Zustand)
├── hooks/               → Hooks personalizados
├── navigation/          → Navegadores (Auth, Driver, Parent)
├── screens/
│   ├── auth/            → Login, Registro
│   ├── driver/          → Dashboard, Rutas, Estudiantes, Pagos
│   └── parent/          → Dashboard, Rastreo, Ausencias, Historial
└── components/
    ├── common/          → Button, Input, Card, Header
    ├── maps/            → Mapa de ruta en tiempo real
    ├── routes/          → Lista de paradas, tarjeta de ruta
    └── students/        → Tarjeta de estudiante, botón de abordaje
```

## Sprints de Desarrollo

| Sprint | Semanas | Historias de Usuario      | Alcance     |
|--------|---------|---------------------------|-------------|
| 0      | 6-8     | HU01 – HU07              | MVP         |
| 1      | 9-10    | HU08 – HU18              | Desarrollo  |
| 2      | 11-12   | HU19 – HU24              | Desarrollo  |
| 3      | 13-14   | HU25 – HU31              | Desarrollo  |
| 4      | 15      | HU32 – HU33              | Despliegue  |

## Equipo

**Grupo 4** – Iván González, Pablo Mendoza, Oliver Saraguro, Vicente Valdivieso

## Licencia

Proyecto académico – Universidad Nacional de Loja, Ciclo VIII.
