# Guía de configuración — WhatsApp y Telegram

Guía paso a paso para dejar funcionando los dos canales de mensajería de GymApp. El código ya está implementado; esto es solo la parte de registro/configuración de cuentas y variables de entorno.

---

## 1. WhatsApp Business Cloud API (Meta)

### 1.1 Crear cuenta de Meta for Developers

1. Entra a https://developers.facebook.com y crea/usa tu cuenta de Facebook.

### 1.2 Crear la app

2. Clic en **"Mis apps"** → **"Crear app"**.
3. En el paso **"Casos de uso"**, filtra por **"Mensajes comerciales"** (no "Otros") y selecciona la opción de **WhatsApp Business Platform**.
   - Si no aparece ahí ni en "Todo", como alternativa puedes elegir **"Crear una app sin un caso de uso"** y agregar el producto WhatsApp manualmente después desde el Dashboard.

### 1.3 Conectar un Portfolio Comercial (Business Manager)

4. En el paso **"Negocio"**, si no tienes uno, clic en **"crea uno nuevo"** (o ve a https://business.facebook.com/overview).
5. Completa: nombre del negocio (usa el nombre real del gym — este mismo portfolio se verificará después con documentos legales, no uses algo temporal), tu nombre, y un email de trabajo real.
6. Confirma el correo si te lo pide.
7. Regresa al flujo de creación de la app y selecciona el portfolio recién creado → **Siguiente** hasta terminar.

### 1.4 Número de prueba y número real

8. Meta te da automáticamente un **número de prueba gratuito** — úsalo primero para probar sin arriesgar tu número real.
9. Para producción: en el producto WhatsApp → **"Configuración de la API"** → **"Agregar número de teléfono"** → verifica por SMS/llamada.
   - Importante: ese número **no puede tener ya una cuenta de WhatsApp normal o Business activa** — debe estar limpio o eliminarlo primero de la app de WhatsApp del celular.

### 1.5 Verificación del negocio

10. Ve a **"Configuración de la empresa"** → **"Verificación empresarial"** → sube documentos legales del gimnasio (registro de comercio/NIT, comprobante de dirección). Esto es obligatorio para pasar de número de prueba a número real de producción con volumen.

### 1.6 Token de acceso permanente

11. Los tokens temporales duran 24h. Para producción, crea un **token de sistema de usuario (System User)**:
    - **"Configuración de la empresa"** → **"Usuarios del sistema"** → crear uno nuevo.
    - Generar token con permisos `whatsapp_business_messaging` y `whatsapp_business_management`, **sin fecha de expiración**.

### 1.7 Variables de entorno

12. Copia estos valores a Doppler/`.env` de `apps/api`:

    | Variable                   | Dónde encontrarla                                                  |
    | -------------------------- | ------------------------------------------------------------------ |
    | `WHATSAPP_PHONE_NUMBER_ID` | Producto WhatsApp → "Configuración de la API"                      |
    | `WHATSAPP_ACCESS_TOKEN`    | El token del System User (paso 11)                                 |
    | `WHATSAPP_VERIFY_TOKEN`    | Lo inventas tú (cualquier string), lo usarás también en el paso 13 |
    | `WHATSAPP_APP_SECRET`      | Producto app → "Configuración básica"                              |

### 1.8 Configurar el Webhook

13. Producto WhatsApp → **"Configuración"** → **"Webhook"**:
    - URL: `https://tu-dominio-api.com/api/v1/webhooks/whatsapp`
    - Verify Token: el mismo `WHATSAPP_VERIFY_TOKEN` del paso 12.
    - Suscríbete al campo **`messages`**.

### 1.9 Plantillas de mensaje

14. **"Administrador de WhatsApp Manager"** → **"Plantillas de mensajes"** → crea una por cada caso de uso:
    - Recordatorio de pago (dunning)
    - Retención (inactividad/renovación)
    - Anuncio general
    - Espera la aprobación de Meta (usualmente horas, a veces 1-2 días).

### 1.10 Acceso avanzado

15. Una vez tengas tráfico real, solicita **"Advanced Access"** para `whatsapp_business_messaging` — Meta revisa el caso de uso antes de permitir volumen alto.

---

## 2. Telegram (bot único de la plataforma)

Mucho más simple — la API de Telegram es oficial y no requiere verificación de negocio.

### 2.1 Crear el bot

1. Abre Telegram, busca **@BotFather** y escríbele.
2. Envía `/newbot`.
3. Ponle un **nombre para mostrar** (ej. "GymApp Asistente").
4. Ponle un **username** que termine en `bot` (ej. `gymapp_aria_bot`).
5. BotFather te entrega un **token** — cópialo, no lo compartas.

### 2.2 Variables de entorno

6. En Doppler/`.env` de `apps/api` agrega:

   | Variable                | Valor                                          |
   | ----------------------- | ---------------------------------------------- |
   | `TELEGRAM_BOT_TOKEN`    | El token del paso 5                            |
   | `TELEGRAM_BOT_USERNAME` | El username sin la `@` (ej. `gymapp_aria_bot`) |

### 2.3 Configurar el Webhook

7. Con el backend ya desplegado, visita esta URL **una sola vez** en el navegador (reemplaza `<TOKEN>` y tu dominio real):

   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://tu-dominio-api.com/api/v1/webhooks/telegram
   ```

8. Deberías ver una respuesta JSON con `"ok": true`.

### 2.4 Cómo lo usan los miembros

- Desde la app móvil: **Ajustes → Telegram → Vincular con Telegram**.
- Genera un código de 6 dígitos y abre Telegram automáticamente (o lo pueden escribir a mano).
- En Telegram, le envían al bot: `/start CODIGO`.
- El bot confirma la vinculación y a partir de ahí cualquier mensaje que le escriban se responde con **ARIA** (el mismo asistente del chat web/app — comparte historial de conversación entre canales).

---

## 3. Checklist final antes de dar por listo

- [ ] `.env`/Doppler de `apps/api` tiene las 4 variables de WhatsApp + las 2 de Telegram.
- [ ] Webhook de WhatsApp configurado y verificado (Meta muestra un ✅ verde junto al webhook si la verificación fue exitosa).
- [ ] Webhook de Telegram configurado (respuesta `"ok": true` al visitar la URL de `setWebhook`).
- [ ] Al menos las plantillas de WhatsApp para recordatorio de pago y retención están aprobadas por Meta.
- [ ] Migración pendiente aplicada: `npx prisma migrate deploy` desde `apps/api` (incluye `20260707140000_telegram_links`).
- [ ] Prueba real: manda un mensaje de prueba por WhatsApp (número de prueba) y por Telegram (`/start CODIGO` con tu propio usuario) para confirmar que responden.
