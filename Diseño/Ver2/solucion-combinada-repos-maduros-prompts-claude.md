# Solución combinada con repos maduros y prompts exactos para Claude Code

Este documento propone una selección estricta de repositorios maduros y una arquitectura combinada para construir asistentes empresariales y profesionales con WhatsApp, Telegram y voz en español, usando Node.js y Python. La recomendación prioriza componentes que ya funcionan como base real: BuilderBot para WhatsApp, OpenVoiceOS y su servidor TTS para voz desacoplada, y Piper como motor local de voz; además, Coqui XTTS-v2 se incorpora cuando se necesita clonación de voz en español.[web:71][web:39][web:129][web:117][web:108][web:91][web:101]

## Qué significa “maduro” aquí

En este contexto, un repositorio maduro no significa que sea plug-and-play perfecto, sino que ya puede usarse como base funcional en un entorno real con ajustes razonables. Los criterios usados fueron: documentación suficiente, caso de uso claro, capacidad de integración real y enfoque de producto o framework más allá de una simple demo.[web:129][web:117][web:108][web:144]

## Selección estricta

Esta selección es más estricta que la lista anterior y deja fuera repositorios que sirven como demo o referencia puntual, pero no como base principal para una solución seria.[web:129][web:117][web:108]

| Repositorio                                                                                 | Rol en la solución                              | Stack          | Motivo de inclusión                                                                                                                            | Usarlo como base principal          |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| [codigoencasa/builderbot](https://github.com/codigoencasa/builderbot)                       | Canal WhatsApp y orquestación de conversaciones | Node.js        | Framework open source para crear chatbots y smart apps conectados a distintos canales, con fuerte foco práctico en WhatsApp.[web:129][web:143] | Sí                                  |
| [OpenVoiceOS](https://github.com/openvoiceos)                                               | Ecosistema de voz open source                   | Python         | Plataforma comunitaria de voice AI con foco en privacidad y customización, adecuada como base de voz desacoplada.[web:117][web:144]            | Sí                                  |
| [OpenVoiceOS/ovos-tts-server](https://github.com/OpenVoiceOS/ovos-tts-server)               | Microservicio HTTP de TTS                       | Python/FastAPI | Permite exponer motores TTS por HTTP y desacoplar completamente la voz del resto del sistema.[web:108][web:140]                                | Sí                                  |
| [rhasspy/piper](https://github.com/rhasspy/piper)                                           | Motor TTS local rápido                          | Python/C++     | Sistema local de text-to-speech rápido, apropiado para producción de bajo costo y sin dependencia de APIs pagas.[web:91][web:90]               | Sí                                  |
| [coqui/XTTS-v2](https://huggingface.co/coqui/XTTS-v2)                                       | Clonación de voz en español                     | Python         | Modelo multilingüe que permite clonar voces con una muestra corta y soporta español.[web:101]                                                  | Sí, cuando se requiera clonación    |
| [paraparata/rasa-telegram-connector](https://github.com/paraparata/rasa-telegram-connector) | Conector Telegram                               | Python         | Pieza funcional para Telegram si se desea una ruta basada en Rasa para ese canal.[web:146]                                                     | No, solo como referencia o conector |

## Decisión arquitectónica

La mejor solución para tus casos de uso no es un único repositorio, sino una composición por capas. BuilderBot resuelve el canal de WhatsApp en Node.js; Telegram se implementa con un adaptador propio o tomando ideas del conector de Rasa; y la voz queda desacoplada como microservicio Python usando OVOS TTS Server, Piper y XTTS-v2 cuando haga falta clonación.[web:71][web:129][web:108][web:91][web:101][web:146]

## Arquitectura objetivo

### Capas

1. **Canales**
   - WhatsApp: BuilderBot.[web:129]
   - Telegram: adaptador propio con patrón similar a conector, o referencia Rasa Telegram connector.[web:146]
   - Web chat: frontend Next.js propio.[web:39]

2. **Orquestación**
   - API gateway en Node.js/TypeScript.
   - Runtime agentic propio.
   - Policy engine.
   - Audit trail.[web:39][web:133]

3. **Conocimiento y datos**
   - Supabase/Postgres.
   - Storage para archivos.
   - pgvector o índice vectorial acoplado a Supabase.[web:3][web:39]

4. **Voz**
   - OVOS TTS Server como microservicio HTTP.[web:108]
   - Piper para TTS operativo normal.[web:91]
   - XTTS-v2 para clonación o voces premium internas.[web:101]

5. **Servicios Python especializados**
   - STT si lo agregas después.
   - extracción documental.
   - procesamiento multimodal.
   - motores especializados por dominio.[web:4][web:39]

## Cuándo usar cada pieza

| Necesidad               | Componente recomendado                      | Razón                                                                                                             |
| ----------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Bot robusto en WhatsApp | BuilderBot                                  | Es la pieza más madura y directa para WhatsApp en Node.js.[web:129][web:143]                                      |
| Voz local rápida        | Piper                                       | Responde rápido y no depende de APIs externas.[web:91]                                                            |
| Exponer voz por HTTP    | OVOS TTS Server                             | Desacopla voz de los bots y del backend principal.[web:108]                                                       |
| Clonar voz en español   | XTTS-v2                                     | Es la mejor ruta local encontrada para clonación multilingüe en español.[web:101]                                 |
| Telegram                | Adaptador propio + referencia conector Rasa | No se encontró una pieza tan sólida como BuilderBot para Telegram; conviene adaptador propio controlado.[web:146] |

## Monorepo propuesto

```text
ai-assistants-platform/
  apps/
    web/
    api/
    whatsapp-bot/
    telegram-bot/
  services/
    tts-service/
    voice-clone-service/
    extraction-service/
    embeddings-service/
  packages/
    agent-core/
    policy-engine/
    tool-registry/
    audit-sdk/
    db/
    shared-types/
  infra/
    docker/
    supabase/
    scripts/
```

## Flujo combinado

1. El usuario entra por WhatsApp, Telegram o web chat.[web:71][web:129]
2. El canal normaliza el mensaje y lo envía al API gateway.
3. El runtime agentic clasifica intención, contexto y riesgo.[web:133]
4. Si la respuesta requiere datos, consulta Supabase o la knowledge base.[web:3][web:4]
5. Si la salida debe ser por voz, llama al microservicio TTS.
6. Si el tenant tiene voz clonada autorizada, usa XTTS-v2; si no, Piper.[web:91][web:101]
7. El canal entrega texto, audio o ambos.
8. Todo queda auditado.[web:39]

## Prompt maestro para Claude Code

```text
Actúa como un arquitecto principal de software especializado en asistentes agentic multicanal de producción.

Quiero que construyas una solución combinada basada en estos componentes:
- BuilderBot para WhatsApp en Node.js
- un adaptador propio para Telegram en Node.js/TypeScript
- OpenVoiceOS OVOS TTS Server como microservicio de voz en Python/FastAPI
- Piper como motor TTS local por defecto
- XTTS-v2 como motor opcional para clonación de voz en español
- Supabase/Postgres como base de datos y storage
- Backend principal en Node.js/TypeScript
- Frontend web en Next.js

Objetivo funcional:
- atender usuarios por WhatsApp, Telegram y web chat
- responder consultas usando conocimiento documental y datos del sistema
- enviar texto o audio según canal y preferencia
- permitir clonación de voz para tenants autorizados
- soportar una arquitectura multi-tenant
- registrar auditoría y policy checks

Tu tarea:
1. Diseña el monorepo completo.
2. Implementa la estructura real de carpetas.
3. Construye apps y services desacoplados.
4. Crea Docker Compose para todos los servicios.
5. Genera migraciones SQL iniciales.
6. Define contratos TypeScript compartidos.
7. Implementa APIs internas entre bots, backend y servicios de voz.
8. Crea README con instrucciones de ejecución local.

Condiciones:
- No uses pseudocódigo.
- Crea archivos reales.
- Usa TypeScript estricto en Node.
- Usa FastAPI en Python para voz.
- Deja XTTS-v2 como módulo opcional activable por configuración.
- Implementa auditoría y policy engine desde el inicio.
```

## Prompt para WhatsApp con BuilderBot

```text
Quiero que implementes el canal de WhatsApp usando BuilderBot dentro del monorepo.

Requisitos:
- app independiente en apps/whatsapp-bot
- integración con el backend principal vía HTTP o cola
- soporte para texto, audio y archivos
- reintentos y manejo de errores
- trazabilidad por tenant, canal, session_id y user_id
- capacidad de enviar texto o audio generado por TTS

Necesito:
- estructura de carpetas
- bootstrap del bot
- adaptador para normalizar inbound y outbound messages
- webhooks
- configuración por entorno
- pruebas básicas

No quiero un demo aislado; quiero una app mantenible lista para integrarse con el backend principal.
```

## Prompt para Telegram propio

```text
Implementa un bot de Telegram en Node.js/TypeScript siguiendo el mismo contrato canónico que WhatsApp.

Objetivos:
- reutilizar shared-types y agent-core
- recibir texto, notas de voz y adjuntos
- enviar texto y audio
- tener una capa adapter que traduzca Telegram a mi contrato interno

Quiero:
- app en apps/telegram-bot
- webhook o polling configurable
- normalizador de mensajes
- emisor de respuestas
- soporte para session state
- integración con backend principal

Toma como referencia el patrón de conectores de Telegram usados en ecosistemas tipo Rasa, pero implementa una solución propia más limpia y orientada a producción.
```

## Prompt para API Gateway y runtime agentic

```text
Construye el backend principal en Node.js/TypeScript para una plataforma de asistentes multicanal.

Debe incluir:
- API gateway
- session manager
- tenant resolver
- agent runtime
- tool registry
- policy engine
- audit logger
- query layer para Supabase/Postgres
- retrieval layer para knowledge base
- formatter de respuestas multicanal

Flujo esperado:
1. recibe inbound_message normalizado
2. resuelve tenant y permisos
3. clasifica intención
4. decide si responde directo, consulta datos, consulta KB o usa tools
5. prepara respuesta final
6. si el canal soporta voz y se requiere audio, llama al tts-service
7. devuelve outbound_message al canal

Entrega:
- arquitectura limpia
- contratos
- rutas HTTP internas
- casos de uso
- tests básicos
```

## Prompt para OVOS TTS Server

```text
Quiero integrar OVOS TTS Server como microservicio de voz dentro de mi solución.

Necesito:
- app en services/tts-service
- Dockerfile propio
- configuración para exponer HTTP interno
- integración con Piper como voz por defecto
- endpoints para sintetizar texto y devolver audio
- soporte para elegir voz por tenant
- auditoría de síntesis
- healthcheck y métricas básicas

Entrega código y configuración real, listo para ejecutarse en Docker Compose.
```

## Prompt para Piper

```text
Implementa Piper como backend TTS por defecto del servicio de voz.

Requisitos:
- selección de voces en español
- configuración por tenant y por idioma
- pipeline para recibir texto y devolver audio en formato adecuado para web, WhatsApp y Telegram
- normalización de sample rate y formato de salida
- caché opcional de frases repetidas

Quiero que el servicio deje claro cómo cambiar entre distintas voces y cómo preparar salidas aptas para mensajería.
```

## Prompt para clonación con XTTS-v2

```text
Agrega un módulo opcional de clonación de voz usando XTTS-v2.

Condiciones:
- debe ser opcional por configuración
- solo tenants autorizados pueden usarlo
- debe existir un proceso de registro de voz con validaciones mínimas
- se debe almacenar metadata de voz clonada en base de datos
- el servicio debe decidir entre Piper y XTTS según la configuración del tenant
- debe quedar registro de cada uso de voz clonada

Entrega:
- servicio o submódulo en services/voice-clone-service
- contratos de API
- almacenamiento de perfiles de voz
- integración con el tts-service principal
```

## Prompt para policy engine

```text
Implementa un policy engine para una plataforma multicanal con voz.

Debe evaluar:
- tenant
n- canal
- tipo de mensaje
- rol del usuario
- tipo de salida
- si se permite voz clonada
- si se permite consulta a datos sensibles
- si se permite ejecutar tools externas

Resultados:
- allow
- allow_with_logging
- allow_with_confirmation
- deny

Quiero una implementación reusable en packages/policy-engine con pruebas y ejemplos.
```

## Prompt para auditoría completa

```text
Construye un subsistema de auditoría integral.

Debe registrar:
- inbound_message
- outbound_message
- intención detectada
- documentos consultados
- queries a BD
- tools ejecutadas
- síntesis de voz
- uso de voz clonada
- decisiones del policy engine
- errores y reintentos

Requisitos:
- tablas en Postgres
- SDK reutilizable en Node y Python
- trazabilidad por tenant, canal, usuario y sesión
- exportación para revisión
```

## Prompt para integración con Supabase

```text
Diseña e implementa la integración con Supabase para una plataforma de asistentes multicanal.

Necesito tablas para:
- tenants
- users
- channel_accounts
- conversations
- messages
- documents
- extracted_chunks
- embeddings_jobs
- voice_profiles
- tts_requests
- tool_runs
- audit_logs
- policies
- appointments

Además:
- migraciones SQL
- RLS
- seed mínimo
- tipos TypeScript generados
- repositorio db reutilizable
```

## Prompt para knowledge base e ingesta

```text
Implementa un subsistema de knowledge base e ingesta documental.

Entradas:
- PDF
- URL
- video
- audio
- imagen
- texto

Flujo:
1. recibir fuente
2. almacenar original
3. extraer contenido
4. chunking
5. embeddings
6. indexación por tenant y dominio
7. retrieval

Quiero módulos desacoplados, workers, tablas y endpoints. Debe integrarse con el runtime agentic para responder preguntas de negocio y asesoría profesional.
```

## Cómo combinarlo por caso de uso

### Caso 1: Asistente empresarial

Usa la solución completa tal cual. BuilderBot atiende WhatsApp, el bot de Telegram cubre ese canal, el backend consulta BD y knowledge base, y el tts-service sirve audio cuando el canal o el caso lo requieran.[web:71][web:129][web:108][web:91]

### Caso 2: Asistente de capacitación

Reutiliza la misma base de canales, datos y voz, pero añade un navegador controlado y un entorno de capacitación separado. La voz puede servir para explicar pasos, pero aquí el componente crítico sigue siendo el backend agentic y la capa de sesión guiada.[web:39]

### Caso 4: Asistentes profesionales

Usa la misma base que el caso empresarial, agregando retrieval documental fuerte y razonamiento cruzado sobre datos y documentos. La arquitectura combinada ya deja listas las piezas necesarias para eso.[web:71][web:4][web:39]

### Caso 3: ALMA

No debe implementarse sobre esta misma solución sin separación fuerte de infraestructura, gobierno y políticas. La base técnica puede inspirar parte de la capa multicanal y de voz, pero el dominio clínico requiere una línea separada con protocolos, límites y supervisión humana obligatoria.[web:64][web:67][web:57]

## Orden recomendado de implementación

1. Monorepo y backend principal.[web:39]
2. WhatsApp con BuilderBot.[web:129]
3. Telegram con adaptador propio.
4. OVOS TTS Server.[web:108]
5. Piper como voz por defecto.[web:91]
6. Supabase y knowledge base.[web:3][web:4]
7. XTTS-v2 como módulo opcional de clonación.[web:101]
8. Policy engine y auditoría total.[web:133]

## Decisión final

Si la meta es construir una solución seria y reutilizable para tus asistentes empresariales, profesionales y de capacitación, la combinación más razonable hoy es BuilderBot + backend propio Node.js/TypeScript + Supabase + OVOS TTS Server + Piper + XTTS-v2 opcional. Esa mezcla equilibra madurez, control técnico, costo y capacidad de crecer hacia voz en español y clonación sin depender por completo de APIs pagas.[web:71][web:129][web:108][web:91][web:101]
