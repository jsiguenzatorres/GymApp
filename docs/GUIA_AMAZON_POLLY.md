# Guía de configuración — Amazon Polly (TTS de ARIA/ZEUS)

Reemplaza a ElevenLabs por ser ~4x más barato y tener voces neuronales en español latino ("Lupe", "Pedro"). No usa el SDK de AWS — el backend firma las peticiones REST directamente (SigV4) para no agregar una dependencia nueva.

## 1. Crear cuenta de AWS (si no tienes una)

1. Ve a https://aws.amazon.com y crea una cuenta (requiere tarjeta, pero Polly tiene capa gratuita: 5 millones de caracteres/mes durante los primeros 12 meses).

## 2. Crear un usuario IAM con permisos de Polly

2. Ve a la consola de AWS → **IAM** → **Usuarios** → **Crear usuario**.
3. Nombre: `gymapp-polly` (o el que prefieras).
4. **No** le des acceso a la consola — es solo para uso programático (API).
5. En permisos, adjunta la política **`AmazonPollyReadOnlyAccess`** (o crea una política custom que solo permita `polly:SynthesizeSpeech`, más restrictivo y recomendado).
6. Termina de crear el usuario.

## 3. Generar las credenciales

7. Entra al usuario recién creado → pestaña **"Credenciales de seguridad"** → **"Crear clave de acceso"**.
8. Selecciona el caso de uso **"Aplicación que se ejecuta fuera de AWS"**.
9. Copia el **Access Key ID** y el **Secret Access Key** — el secreto solo se muestra una vez, guárdalo bien.

## 4. Variables de entorno

10. En Doppler/`.env` de `apps/api` agrega:

    | Variable                | Valor                                                                                                                   |
    | ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
    | `AWS_ACCESS_KEY_ID`     | El Access Key ID del paso 9                                                                                             |
    | `AWS_SECRET_ACCESS_KEY` | El Secret Access Key del paso 9                                                                                         |
    | `AWS_REGION`            | Región de AWS donde quieres correr Polly (ej. `us-east-1`)                                                              |
    | `POLLY_VOICE_ID`        | Opcional — por defecto `Lupe` (voz femenina, español latino, neural). Otras opciones: `Pedro` (masculino, mismo acento) |

## 5. Probar

11. Con el backend corriendo, prueba el endpoint:
    ```
    POST /api/v1/ai/tts
    Body: { "text": "Hola, soy ARIA, tu asistente virtual." }
    ```
    Debería devolver `{ "audio": "<base64>", "mimeType": "audio/mpeg" }`.

## Notas

- No se necesita clonación de voz para este proyecto — solo síntesis con voces predefinidas de Polly.
- El engine usado es `neural` (mejor calidad que `standard`); si `Lupe`/`Pedro` no están disponibles en tu región, cambia `AWS_REGION` a `us-east-1` (Polly Neural no está disponible en todas las regiones).
- Costo aproximado: ~$16 por cada 1 millón de caracteres con el motor neural — mucho más barato que ElevenLabs para el mismo volumen.
