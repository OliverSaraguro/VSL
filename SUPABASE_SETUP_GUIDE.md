# Guía de Configuración, Pruebas y Despliegue de VSL

Esta guía detalla paso a paso cómo inicializar el backend en Supabase, probar el sistema de forma local, compilar la aplicación móvil React Native en un archivo APK instalable y distribuirla a usuarios de prueba sin usar Google Play Store.

---

## 💾 Paso 1: Configurar la Base de Datos en Supabase

1. **Crear una cuenta y proyecto**:
   - Ingresa a [supabase.com](https://supabase.com) y regístrate.
   - Crea un nuevo proyecto llamado **VSL** e introduce una contraseña segura para la base de datos.
   - Selecciona la región más cercana a tus usuarios (por ejemplo, `us-east-1` para Ecuador).

2. **Cargar el Esquema Relacional**:
   - Una vez creado el proyecto, ve a la barra lateral izquierda y haz clic en **SQL Editor**.
   - Haz clic en **New query** (Nueva consulta).
   - Abre el archivo [database.sql](file:///c:/Users/ipgonzalez2/Desktop/VSL/VSL/database.sql) en el proyecto, copia todo su contenido y pégalo en el editor de SQL de Supabase.
   - Haz clic en **Run** (Ejecutar) en la esquina inferior derecha. Esto creará todas las tablas, tipos enums, políticas de seguridad RLS y el trigger de sincronización automática de usuarios.

3. **Desactivar la Confirmación de Correo (Recomendado para pruebas e hitos rápidos)**:
   - Ve a **Project Settings** (icono de engranaje) -> **Auth**.
   - Desmarca la opción **Confirm email** (Confirmar correo electrónico) tanto en los proveedores de registro clásicos como en el flujo general.
   - *Nota: Esto permitirá crear usuarios de prueba y que inicien sesión inmediatamente sin necesidad de verificar su bandeja de entrada.*

---

## 🔐 Paso 2: Conectar la App Móvil con Supabase

1. **Obtener las Credenciales API**:
   - Ve a **Project Settings** -> **API**.
   - Copia la **Project URL** (ejemplo: `https://abcdxyz.supabase.co`).
   - Copia la **anon public** key (ejemplo: `eyJhbGciOi...`).

2. **Crear archivo de Variables de Entorno**:
   - En la carpeta `mobile/`, crea un archivo llamado `.env`:
     ```env
     EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
     EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-publica
     ```
   - *Nota: React Native Expo (versiones 49+) carga automáticamente las variables que inician con `EXPO_PUBLIC_` en la aplicación de forma nativa.*

---

## 🏃 Paso 3: Ejecución y Pruebas Locales

1. **Instalar Dependencias**:
   - Asegúrate de tener Node.js instalado. Abre la terminal en el directorio `mobile/` y ejecuta:
     ```bash
     cd mobile
     npm install
     ```

2. **Iniciar Servidor de Desarrollo (Metro Bundler)**:
   - Ejecuta:
     ```bash
     npx expo start
     ```
   - Esto abrirá una interfaz en la consola y mostrará un código QR.

3. **Probar en Dispositivo Físico (Recomendado)**:
   - Instala la app **Expo Go** en tu celular desde Google Play Store (Android) o App Store (iOS).
   - Abre la cámara (iOS) o la app Expo Go (Android) y escanea el código QR de la consola.
   - La aplicación se descargará e iniciará inmediatamente en tu dispositivo.

4. **Probar en Emulador**:
   - Si tienes Android Studio instalado y configurado con un dispositivo virtual:
     - Presiona la tecla `a` en la consola para abrir el emulador de Android.

---

## 🧪 Paso 4: Creación y Pruebas con Usuarios de Prueba

Para probar el flujo completo entre un **Conductor** y un **Padre de Familia** usando dos sesiones en paralelo:

1. **Registro del Conductor**:
   - En la app, haz clic en **Registrarse como Conductor**.
   - Completa el formulario de datos personales y del vehículo (placa, licencia, modelo, color) y presiona **Crear cuenta**.
   - Inicia sesión con las credenciales registradas.

2. **Registro del Padre**:
   - En la app, haz clic en **Registrarse como Padre**.
   - Completa el formulario de datos personales y presiona **Crear cuenta**.
   - Inicia sesión con las credenciales registradas.

3. **Verificación en Supabase**:
   - Ve al panel de Supabase -> **Table Editor**.
   - Revisa la tabla `users` para ver ambos perfiles.
   - Revisa las tablas `drivers` y `parents` para comprobar que el trigger SQL haya propagado los datos correspondientes automáticamente.

---

## 📦 Paso 5: Generación de Build / APK de Prueba

Expo te permite compilar e implementar archivos `.apk` directamente en la nube utilizando **EAS Build**, sin necesidad de configurar compilaciones locales pesadas de Android Studio.

1. **Instalar el CLI de EAS de forma global**:
   ```bash
   npm install -g eas-cli
   ```

2. **Iniciar Sesión en Expo**:
   ```bash
   eas login
   ```
   *(Si no tienes cuenta, crea una gratis en [expo.dev](https://expo.dev)).*

3. **Configurar el Proyecto**:
   - Ejecuta en la carpeta `mobile/`:
     ```bash
     eas build:configure
     ```
   - Te preguntará si deseas crear el proyecto en tu cuenta de Expo. Elige `Yes`.

4. **Configurar Perfil de Compilación APK**:
   - Abre el archivo `eas.json` generado en la carpeta `mobile/` y asegúrate de agregar un perfil para compilar archivos APK directos (por defecto Expo compila paquetes AAB para Play Store). Edítalo para que luzca así:
     ```json
     {
       "cli": {
         "version": ">= 10.0.0"
       },
       "build": {
         "development": {
           "developmentClient": true,
           "distribution": "internal"
         },
         "preview": {
           "android": {
             "buildType": "apk"
           }
         },
         "production": {}
       },
       "submit": {
         "production": {}
       }
     }
     ```

5. **Iniciar la Compilación en la Nube**:
   - Para generar el archivo APK ejecutable, corre el siguiente comando en tu terminal:
     ```bash
     eas build --platform android --profile preview
     ```
   - EAS empaquetará el código y compilará el APK en sus servidores. Tardará unos minutos.
   - Al finalizar, la terminal te devolverá un **código QR y un enlace directo de descarga**.

---

## 🚀 Paso 6: Distribución Real sin Play Store

Dado que no se usará la Play Store por el momento, existen 3 alternativas viables y seguras para compartir el APK con los padres de familia y conductores:

### Opción A: Descarga Directa mediante Enlace / QR (Rápido y Sencillo)
- **Cómo funciona**: Al terminar `eas build --platform android --profile preview`, Expo aloja tu archivo `.apk` de manera segura en sus servidores y te da un enlace permanente de descarga.
- **Distribución**: Puedes enviar este enlace o el código QR por WhatsApp, correo o redes sociales. Los usuarios simplemente abren el link en su celular, descargan el APK e instalan la aplicación aceptando el permiso de "Orígenes desconocidos".

### Opción B: Firebase App Distribution (Profesional y Controlado)
- **Cómo funciona**: Google ofrece una plataforma gratuita para distribuir versiones de prueba de apps a grupos cerrados de usuarios mediante invitaciones por correo electrónico.
- **Pasos**:
  1. Ve a [console.firebase.google.com](https://console.firebase.google.com) y crea un proyecto.
  2. Registra una aplicación Android con el ID de paquete `com.vsl.app`.
  3. Ve a la sección **App Distribution** en la barra lateral.
  4. Sube el archivo `.apk` que descargaste de EAS Build.
  5. Agrega los correos electrónicos de los conductores y padres que probarán la app.
  6. Los evaluadores recibirán un correo con instrucciones para descargar una app segura de Firebase llamada *App Tester*, desde la cual instalarán y actualizarán VSL con un solo toque de forma segura.

### Opción C: Almacenamiento en la Nube Compartido
- **Cómo funciona**: Subir el archivo APK a servicios como **Google Drive**, **OneDrive** o **Dropbox**.
- **Distribución**: Crea una carpeta compartida en Google Drive, sube el archivo `vsl-app.apk` y comparte el enlace de la carpeta con permisos de "Lector" para cualquier persona que tenga el enlace. Los usuarios podrán descargarlo directamente e instalarlo en su celular.
