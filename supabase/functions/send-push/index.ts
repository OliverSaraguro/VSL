// Edge Function: send-push
//
// Recibe { pushToken, title, body, data } desde el trigger de Postgres
// (public.handle_notification_push, ver migration_push_notifications.sql) y lo reenvía a la
// Expo Push API para entregarlo como notificación push real del sistema operativo — incluso si
// la app VSL está cerrada (HU09, y de paso HU14/HU15/HU16/HU24/HU05/HU26: todo lo que ya se
// inserta en `public.notifications` pasa por aquí automáticamente).
//
// Despliegue (requiere Supabase CLI con sesión iniciada y el proyecto enlazado):
//   supabase functions deploy send-push --no-verify-jwt
//
// El "--no-verify-jwt" es necesario porque quien llama es el trigger de Postgres (vía pg_net),
// no un usuario con sesión de Supabase Auth — la función valida la llamada con su propio secreto
// compartido (ver PUSH_FUNCTION_SECRET) en vez del JWT de Auth.

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface SendPushPayload {
  pushToken: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Verifica el secreto compartido (Authorization: Bearer <PUSH_FUNCTION_SECRET>) en vez del JWT
  // de Supabase Auth, ya que quien invoca es el trigger de Postgres, no un usuario logueado.
  const expectedSecret = Deno.env.get('PUSH_FUNCTION_SECRET');
  const authHeader = req.headers.get('Authorization') ?? '';
  const providedSecret = authHeader.replace(/^Bearer\s+/i, '');
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: SendPushPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  if (!payload.pushToken || !payload.title || !payload.body) {
    return new Response('Missing pushToken, title or body', { status: 400 });
  }

  const expoResponse = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    body: JSON.stringify({
      to: payload.pushToken,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      sound: 'default',
      priority: 'high',
    }),
  });

  const result = await expoResponse.json().catch(() => null);

  if (!expoResponse.ok) {
    console.error('Expo push API error:', result);
    return new Response(JSON.stringify({ ok: false, error: result }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, result }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
