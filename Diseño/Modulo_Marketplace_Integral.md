# 🛒 MÓDULO MARKETPLACE INTEGRAL

## Venta de Alimentos, Suplementos & Servicios — App Gimnasio de Élite

### Documento de Diseño Detallado — Versión 1.0 · Junio 2026

---

> **Código del Módulo:** `GYM-MOD-MKT`  
> **Prioridad:** Fase 2  
> **Módulos relacionados:** Billing & Pagos (MOD-BIL), CRM/ARIA (MOD-CRM), Membresías (MOD-MEM), Gamificación (MOD-I), Panel Ejecutivo (MOD-J)

---

## 📋 TABLA DE CONTENIDO

1. [Visión General & Filosofía de Diseño](#1-visión-general--filosofía-de-diseño)
2. [Catálogo de Productos & Gestión de Inventario](#2-catálogo-de-productos--gestión-de-inventario)
3. [Experiencia de Compra — 6 Canales de Pedido](#3-experiencia-de-compra--6-canales-de-pedido)
4. [Motor de IA Visual — Pedido por Foto/Cámara](#4-motor-de-ia-visual--pedido-por-fotocámara)
5. [Pedido por Voz — ARIA como Asistente de Compra](#5-pedido-por-voz--aria-como-asistente-de-compra)
6. [Carrito Inteligente & Checkout](#6-carrito-inteligente--checkout)
7. [Sistema de Pagos Integrado](#7-sistema-de-pagos-integrado)
8. [Crédito en Cuenta — Gestión Completa](#8-crédito-en-cuenta--gestión-completa)
9. [Sistema de Suspensión de Crédito](#9-sistema-de-suspensión-de-crédito)
10. [Fulfillment — Retiro en Mostrador & Entrega](#10-fulfillment--retiro-en-mostrador--entrega)
11. [Motor de Recomendaciones con IA](#11-motor-de-recomendaciones-con-ia)
12. [Programa de Fidelidad Integrado](#12-programa-de-fidelidad-integrado)
13. [Panel de Gestión para el Propietario](#13-panel-de-gestión-para-el-propietario)
14. [Reportes & Analytics de Ventas](#14-reportes--analytics-de-ventas)
15. [Integraciones del Módulo](#15-integraciones-del-módulo)
16. [Funciones Innovadoras Adicionales](#16-funciones-innovadoras-adicionales)
17. [Modelo de Datos Completo](#17-modelo-de-datos-completo)

---

## 1. VISIÓN GENERAL & FILOSOFÍA DE DISEÑO

### 1.1 Propósito

El **Marketplace Integral** transforma la tienda física del gimnasio en un canal de venta omnicanal inteligente. El miembro puede comprar suplementos, alimentos, servicios y artículos desde cualquier lugar, de cualquier forma — por texto, por voz, señalando un producto, tomando una foto o eligiendo de una lista — y retirar en mostrador o recibirlo donde está.

No es una tienda genérica: **es un asistente de compra que conoce los objetivos nutricionales y de entrenamiento del miembro** y le sugiere exactamente lo que necesita en el momento adecuado.

### 1.2 Principios de Diseño

| Principio               | Descripción                                                                      |
| ----------------------- | -------------------------------------------------------------------------------- |
| **Omnicanal**           | El miembro compra como quiera: app, WhatsApp, voz, foto, lista                   |
| **Contextual**          | Las sugerencias se basan en el objetivo, rutina y plan nutricional activo        |
| **Sin fricción**        | Compra en 3 toques o menos; pago con el método ya guardado                       |
| **Crédito inteligente** | Compra ahora, paga cuando puedas — con límites y alertas automáticas             |
| **Transparencia total** | El miembro siempre ve su deuda, su historial, sus facturas                       |
| **Integrado**           | Cada venta actualiza inventario, contabilidad, CRM y facturación automáticamente |

### 1.3 Categorías del Marketplace

```yaml
Categorías principales (configurables por el gym):
  🥤 Suplementos Deportivos:
    subcategorías:
      - Proteínas: whey, caseína, vegana, egg protein, masa muscular
      - Aminoácidos: BCAA, EAA, glutamina, arginina
      - Pre-entreno: energizantes, óxido nítrico, cafeína
      - Post-entreno: recuperación, maltodextrina, creatina
      - Vitaminas y minerales: multivitamínico, omega 3, magnesio, zinc
      - Quemadores de grasa: termogénicos, CLA, L-carnitina
      - Colágeno y articulaciones: colágeno hidrolizado, glucosamina
      - Hidratación: electrolitos, isotónicos

  🥗 Alimentos Saludables:
    subcategorías:
      - Barras proteicas y energéticas
      - Snacks saludables: frutos secos, semillas, chips de vegetales
      - Bebidas: jugos cold press, batidos listos, bebidas energéticas naturales
      - Alimentos frescos (si el gym tiene refrigeración): yogur griego, frutas
      - Alimentos funcionales: avena, granola, mantequilla de maní

  👕 Artículos Deportivos:
    subcategorías:
      - Ropa deportiva: camisetas, shorts, leggings, tops
      - Accesorios: guantes, cinturones, rodilleras, muñequeras
      - Equipamiento pequeño: bandas de resistencia, cuerdas, foam roller
      - Calzado deportivo (si el gym lo ofrece)

  🎓 Servicios & Clases Especiales:
    subcategorías:
      - Sesiones de PT adicionales (más allá de las incluidas en membresía)
      - Packs de clases grupales (clases especiales pagadas)
      - Talleres y workshops
      - Evaluaciones físicas adicionales
      - Consultas nutricionales extra
      - Alquiler de locker mensual

  🛍️ Merchandise del Gym:
    subcategorías:
      - Botellas, vasos y shakers personalizados
      - Mochilas y bolsos del gym
      - Toallas personalizadas
      - Gorras y accesorios

  💊 Paquetes y Combos:
    subcategorías:
      - Combos sugeridos por objetivo (ver sección 11)
      - Packs ahorro: producto + servicio
      - Cajas mensuales: selección curada por el nutricionista del gym
```

---

## 2. CATÁLOGO DE PRODUCTOS & GESTIÓN DE INVENTARIO

### 2.1 Ficha Completa de Producto

```yaml
# Estructura completa de un producto en el catálogo
producto:
  id: UUID
  gym_id: UUID

  # ── IDENTIFICACIÓN ───────────────────────────────────────
  nombre: 'Proteína Whey Gold Standard 2lb'
  nombre_corto: 'Whey Gold 2lb' # para listados compactos
  sku: 'SUPL-WHEY-GOLD-2LB-VAN'
  codigo_barras: '0748927865295'
  codigo_qr: generado_automáticamente

  # ── CLASIFICACIÓN ────────────────────────────────────────
  categoria_id: UUID # suplementos
  subcategoria_id: UUID # proteínas
  marca: 'Optimum Nutrition'
  proveedor_id: UUID
  etiquetas: ['proteína', 'whey', 'ganancia muscular', 'recuperación']
  objetivo_fitness: ['ganancia_muscular', 'definición', 'recuperación']

  # ── DESCRIPCIÓN ─────────────────────────────────────────
  descripcion_corta: 'Proteína whey premium con 24g de proteína por servicio'
  descripcion_larga: 'Texto completo con beneficios, cómo usar, precauciones...'
  ingredientes: 'Proteína concentrada de suero de leche, cacao...'
  alergenos: ['leche', 'soja', 'gluten']

  # ── INFORMACIÓN NUTRICIONAL (POR SERVICIO) ───────────────
  porcion_gramos: 30.4
  nutricion_por_porcion:
    calorias: 120
    proteina_g: 24
    carbohidratos_g: 3
    grasas_g: 1
    grasas_saturadas_g: 0.5
    fibra_g: 0
    sodio_mg: 130
    colesterol_mg: 40
  # Este campo alimenta automáticamente el módulo de nutrición
  # cuando el miembro registra el consumo del producto

  # ── VARIANTES ────────────────────────────────────────────
  tiene_variantes: true
  variantes:
    - sabor: 'Vainilla'
      talla: '2lb'
      sku_variante: 'WHEY-GOLD-2LB-VAN'
      precio: 45.00
      stock: 12
      foto_url: 'cdn/products/whey-gold-vainilla.jpg'
    - sabor: 'Chocolate'
      talla: '2lb'
      sku_variante: 'WHEY-GOLD-2LB-CHO'
      precio: 45.00
      stock: 8
      foto_url: 'cdn/products/whey-gold-chocolate.jpg'
    - sabor: 'Fresa'
      talla: '5lb'
      sku_variante: 'WHEY-GOLD-5LB-FRE'
      precio: 95.00
      stock: 3
      foto_url: 'cdn/products/whey-gold-fresa-5lb.jpg'

  # ── PRECIOS ──────────────────────────────────────────────
  precio_base: 45.00
  precio_con_descuento: null # null = sin descuento activo
  descuento_porcentaje: null
  descuento_vigencia_hasta: null
  precio_mayoreo: 38.00 # para ventas de 3+ unidades
  cantidad_para_mayoreo: 3
  precio_costo: 28.00 # costo del gym (visible solo admin)
  margen_bruto_calculado: 37.8%

  # ── INVENTARIO ───────────────────────────────────────────
  gestiona_inventario: true
  stock_actual: 20 # total sumando variantes
  stock_minimo_alerta: 5 # cuando alertar al admin
  stock_critico: 2 # cuando bloquear ventas online
  unidad_medida: 'unidad'
  ubicacion_fisica: 'Estante A, Posición 3' # para el staff en mostrador

  # ── MODO DE VENTA ────────────────────────────────────────
  disponible_online: true # en la app
  disponible_mostrador: true # en POS físico
  disponible_credito: true # se puede comprar a crédito
  disponible_aria: true # ARIA puede recomendarlo y venderlo

  # ── MULTIMEDIA ───────────────────────────────────────────
  fotos: # hasta 5 fotos
    - url: 'cdn/products/whey-gold-frente.jpg'
      es_principal: true
    - url: 'cdn/products/whey-gold-info-nutricional.jpg'
      es_principal: false
    - url: 'cdn/products/whey-gold-modo-uso.jpg'
      es_principal: false
  video_url: 'cdn/products/whey-gold-demo.mp4' # opcional

  # ── RESEÑAS ──────────────────────────────────────────────
  rating_promedio: 4.7
  total_reseñas: 23

  # ── SEO / BÚSQUEDA INTERNA ───────────────────────────────
  palabras_clave_busqueda: ['proteína', 'whey', 'musculo', 'suplemento']
  sinonimos: ['proteina de suero', 'polvo de proteina']

  # ── METADATA ─────────────────────────────────────────────
  activo: true
  destacado: true # aparece en banner principal
  nuevo: false # badge "Nuevo" en la app
  mas_vendido: true # badge "Más vendido"
  creado_por: UUID_staff
  created_at: timestamp
  updated_at: timestamp
```

### 2.2 Gestión de Inventario en Tiempo Real

```
FLUJO DE INVENTARIO:

Entrada de stock:
  1. Admin registra orden de compra al proveedor
  2. Al recibir el pedido: staff confirma recepción + cantidad
  3. Sistema actualiza stock automáticamente
  4. Si había alertas de stock bajo: se cancelan automáticamente
  5. Notificación: "Stock de Whey Gold repuesto: +24 unidades"

Salida de stock (por venta):
  App online:    stock reservado al añadir al carrito (por 15 min)
                 stock descontado definitivamente al confirmar el pago
  POS mostrador: stock descontado inmediatamente al procesar la venta
  Pedido ARIA:   stock reservado al confirmar el pedido con el miembro

Alertas automáticas de inventario:
  Stock mínimo alcanzado (configurable por producto):
    → Notificación push al admin
    → Email de alerta con lista de productos bajo mínimo
    → Opción de generar orden de compra sugerida con un clic

  Stock en cero:
    → Producto marcado automáticamente como "Sin stock" en la app
    → ARIA no lo ofrece en recomendaciones
    → Botón "Notificarme cuando llegue" disponible para miembros
    → El admin puede seguir vendiéndolo con estado "Pre-orden" si lo configura

Ajustes manuales de inventario:
  Motivo requerido: venta manual / merma / caducado / robo / corrección de error
  Todos los ajustes quedan en el log de auditoría con fecha, hora y usuario
```

### 2.3 Gestión de Proveedores

```yaml
Proveedor:
  nombre: 'BodySupplements El Salvador'
  contacto: nombre, email, teléfono, WhatsApp
  condiciones_pago: crédito 30 días / contado
  tiempo_entrega_dias: 3

  catálogo_de_proveedor: lista de productos que suministra
  histórico_de_órdenes: todas las compras previas

  orden_de_compra:
    - generación manual o sugerida por el sistema (cuando stock bajo)
    - estado: borrador | enviada | confirmada | en_camino | recibida
    - recepción parcial: si solo llegó parte del pedido
    - comparativa: precio acordado vs. precio en factura del proveedor
```

---

## 3. EXPERIENCIA DE COMPRA — 6 CANALES DE PEDIDO

### 3.1 Resumen de los 6 Canales

```
┌──────────────────────────────────────────────────────────────────┐
│          6 FORMAS DE PEDIR EN EL MARKETPLACE                     │
├──────────┬───────────────────────────────────────────────────────┤
│ CANAL 1  │ 📋 LISTA DE PRODUCTOS — Navegar catálogo en la app    │
│ CANAL 2  │ 🔍 BÚSQUEDA DE TEXTO — Escribir el producto          │
│ CANAL 3  │ 🎙️ VOZ — Hablar con ARIA en WhatsApp/app             │
│ CANAL 4  │ 📸 FOTO/CÁMARA — Tomar foto o subir imagen           │
│ CANAL 5  │ 📦 RE-ORDEN RÁPIDA — Repetir compra anterior         │
│ CANAL 6  │ 💬 CHAT CON ARIA — Pedir por texto a ARIA            │
└──────────┴───────────────────────────────────────────────────────┘
```

### 3.2 Canal 1 — Navegación por Lista (App)

```
ESTRUCTURA DE LA TIENDA EN LA APP:

HOME DE LA TIENDA:
  ┌─────────────────────────────────────────────────────┐
  │  🏪 TIENDA DEL GYM [nombre del gym]                 │
  │                                                     │
  │  [🔍 Buscar productos...]  [🎙️ Pedir por voz]       │
  │                                                     │
  │  🔥 OFERTAS DEL DÍA:                                │
  │  [Whey Gold 2lb $38 ← $45]  [BCAA $22 ← $28]       │
  │                                                     │
  │  ⭐ PARA TI (basado en tu objetivo):                 │
  │  "María, según tu plan de pérdida de peso..."       │
  │  [Proteína $45] [L-Carnitina $25] [Barra $3]        │
  │                                                     │
  │  📦 TU ÚLTIMO PEDIDO:                               │
  │  Whey Vainilla 2lb · hace 18 días  [Repetir orden]  │
  │                                                     │
  │  CATEGORÍAS:                                        │
  │  [💊 Suplementos]  [🥗 Alimentos]  [👕 Ropa]        │
  │  [🎓 Servicios]    [🛍️ Merchandise] [📦 Combos]      │
  └─────────────────────────────────────────────────────┘

VISTA DE CATEGORÍA (ej: Suplementos → Proteínas):
  - Grid de productos (2 columnas en mobile, 3 en tablet)
  - Cada tarjeta: foto, nombre, marca, precio, rating, badge stock
  - Filtros: marca, precio (rango slider), objetivo, sabor, tamaño
  - Ordenar: más vendidos / precio ↑ / precio ↓ / rating / nuevo
  - Búsqueda dentro de la categoría

VISTA DE PRODUCTO:
  - Galería de fotos swipeable
  - Nombre, marca, rating con número de reseñas
  - Selector de variante (sabor, tamaño) — precio actualiza en vivo
  - Información nutricional expandible (tabla completa)
  - Descripción completa / ingredientes / modo de uso
  - Badge de compatibilidad: "✅ Compatible con tu objetivo de pérdida de peso"
  - Sección ARIA: "¿Para qué sirve esta proteína?" → responde ARIA
  - Reseñas de otros miembros del gym (no de internet)
  - Productos relacionados / "Compraron juntos"
  - Botón [🛒 Agregar al carrito] prominente
  - Botón [💳 Comprar ahora] → directo al checkout
  - Botón [💬 Preguntar a ARIA sobre este producto]
```

### 3.3 Canal 2 — Búsqueda por Texto

```yaml
Motor de búsqueda interno:

  Búsqueda simple:
    - El miembro escribe "proteína chocolate" o "BCAA"
    - Resultados en tiempo real mientras escribe (debounce 300ms)
    - Búsqueda en: nombre, marca, descripción, etiquetas, sinónimos

  Búsqueda inteligente (NLP):
    - "algo para después de entrenar" → muestra proteínas y aminoácidos post-entreno
    - "quemador de grasa sin cafeína" → filtra termogénicos sin cafeína
    - "barras sin gluten" → filtra barras por alérgeno
    - "suplemento para articulaciones" → colágeno, glucosamina, omega 3

  Autocompletado:
    - Sugerencias de los últimos 5 productos vistos / comprados
    - Top 10 más buscados en el gym
    - Corrección de typos: "proteina" → "proteína", "bcaa" → "BCAA"

  Sin resultados:
    - "No encontramos ese producto"
    - "¿Quisiste decir...?" (sugerencias similares)
    - "Cuéntale a ARIA lo que buscas" → botón de chat/voz
    - Lista de categorías para explorar
```

---

## 4. MOTOR DE IA VISUAL — PEDIDO POR FOTO/CÁMARA

### 4.1 Cómo Funciona

Esta es una de las funciones más innovadoras del Marketplace. El miembro puede **tomar una foto** de un producto físico (el empaque que tiene en casa, un producto en el mostrador del gym, un screenshot de internet, o la foto de un catálogo) y el sistema lo **identifica automáticamente** y lo añade al carrito.

```
FLUJO COMPLETO — PEDIDO POR FOTO:

PASO 1: El miembro accede al canal de foto
  Desde la app: botón de cámara 📸 en la barra de búsqueda
  Desde WhatsApp/Telegram con ARIA: envía la foto directamente

PASO 2: Toma de foto o selección de imagen
  Opciones disponibles:
  ┌────────────────────────────────────────────────┐
  │  ¿Cómo quieres identificar el producto?        │
  │                                                │
  │  [📸 Tomar foto ahora]                         │
  │  [🖼️ Subir foto de mi galería]                 │
  │  [📷 Escanear código de barras]                │
  │  [🔗 Pegar URL de imagen]                      │
  └────────────────────────────────────────────────┘

PASO 3: Procesamiento por IA Visual
  El sistema envía la imagen al motor de visión:

  Motor primario: Google Vision API + búsqueda en catálogo propio
  Motor secundario: OpenAI GPT-4o Vision (para identificación compleja)

  El modelo analiza:
    a) ¿Hay código de barras visible? → búsqueda exacta por EAN
    b) ¿El producto está en el catálogo del gym? → match directo
    c) Texto visible en el empaque (OCR): marca, nombre, presentación
    d) Forma y color del empaque (para productos sin texto legible)
    e) Logo de marca reconocido

PASO 4: Presentación de resultados (< 2 segundos)

  CASO A — Match exacto (producto en el catálogo):
  ┌────────────────────────────────────────────────┐
  │  ✅ ¡Encontramos tu producto!                  │
  │                                                │
  │  [FOTO DEL PRODUCTO EN CATÁLOGO]               │
  │  Proteína Whey Gold Standard 2lb               │
  │  Optimum Nutrition · Vainilla                  │
  │  ⭐4.7 (23 reseñas) · En stock: ✅              │
  │  Precio: $45.00                                │
  │                                                │
  │  [🛒 Agregar al carrito]  [Ver detalle]        │
  └────────────────────────────────────────────────┘

  CASO B — Producto similar encontrado:
  ┌────────────────────────────────────────────────┐
  │  🔍 No tenemos ese exacto, pero tenemos:       │
  │                                                │
  │  [Producto 1] Proteína Whey ISO 2lb · $48      │
  │  [Producto 2] Proteína Vegana 2lb · $42        │
  │  [Producto 3] Proteína 100% Whey 3lb · $65     │
  │                                                │
  │  "¿Cuál de estos te interesa? ARIA puede       │
  │   explicarte las diferencias 💪"               │
  └────────────────────────────────────────────────┘

  CASO C — No identificado:
  ┌────────────────────────────────────────────────┐
  │  😅 No pudimos identificar el producto         │
  │                                                │
  │  Intenta con:                                  │
  │  • Mejor iluminación                           │
  │  • Foto más cercana al empaque                 │
  │  • Apuntar al código de barras                 │
  │                                                │
  │  [📷 Intentar de nuevo]  [💬 Decirle a ARIA]   │
  └────────────────────────────────────────────────┘

PASO 5: Integración con ARIA (si es por WhatsApp)
  El miembro envía la foto directamente a ARIA:

  ARIA recibe la foto → procesa con visión IA → responde:
  "¡Hola María! 😊 Reconocí tu foto: es la Proteína Whey Gold Standard
   de Optimum Nutrition, sabor vainilla.

   ¡La tenemos disponible! 🎉
   📦 Precio: $45.00
   ✅ En stock: 12 unidades

   ¿Te la apunto? Puedes pagarla con tu tarjeta guardada o crédito del gym.
   [Sí, agregar] [Ver más opciones] [No, gracias]"
```

### 4.2 Casos de Uso del Pedido por Foto

```yaml
Casos soportados:
  Foto de producto en casa:
    descripción: 'Me quedé sin mi proteína habitual, tomo foto del pote vacío'
    resultado: identificación por logo + nombre en empaque + código de barras

  Foto de producto en el mostrador del gym:
    descripción: 'Veo un producto en la vitrina, quiero saber el precio'
    resultado: identificación inmediata + precio + agregar al carrito

  Screenshot de tienda online:
    descripción: 'Vi esta proteína en Amazon/MercadoLibre, ¿la tienen?'
    resultado: identificación por imagen de producto + búsqueda en catálogo

  Foto de recomendación de amigo:
    descripción: 'Un amigo me mandó foto de su suplemento favorito'
    resultado: identificación y búsqueda en catálogo del gym

  Foto de receta con ingredientes:
    descripción: 'Tomé foto de una receta de batido proteico'
    resultado: ARIA identifica los ingredientes y busca cada uno en el catálogo

  Foto de lista escrita a mano:
    descripción: 'El nutricionista me dio una lista escrita de suplementos'
    resultado: OCR + búsqueda de cada ítem en el catálogo
    respuesta: 'Reconocí 3 productos de tu lista. ¿Quieres que te muestre
      cuáles tenemos disponibles y cuáles no?'
```

### 4.3 Escáner de Código de Barras

```yaml
Escáner integrado en la app:

  tecnología: ZXing / MLKit Barcode Scanning (nativo en el dispositivo)
  formatos soportados: EAN-13, EAN-8, UPC-A, UPC-E, Code-128, QR Code

  flujo:
    1. El miembro apunta la cámara al código de barras
    2. Lectura en tiempo real (sin presionar botón)
    3. Vibración háptica al detectar código
    4. Búsqueda instantánea en el catálogo del gym
    5. Si está en catálogo: mostrar tarjeta de producto con precio
    6. Si no está: "Este producto no está en nuestra tienda actualmente.
                    ¿Quieres que lo agreguemos? [Sugerir producto]"

  doble uso:
    - Para miembros: buscar y comprar productos
    - Para staff: escanear en POS para venta en mostrador
                  escanear para ajuste de inventario
```

---

## 5. PEDIDO POR VOZ — ARIA COMO ASISTENTE DE COMPRA

### 5.1 Flujo de Compra por Voz con ARIA

El miembro puede hacer su pedido completo hablando — sin tocar la pantalla. Funciona en la app (nota de voz) y en WhatsApp/Telegram (mensaje de audio).

```
FLUJO DE COMPRA POR VOZ:

USUARIO envía audio: "ARIA, quiero pedir mi proteína habitual
                      y una caja de barras de chocolate"

PASO 1: TRANSCRIPCIÓN (STT)
  Whisper AI transcribe el audio a texto en < 1 segundo
  Muestra la transcripción al miembro para confirmar que entendió bien:
  "Escuché: 'proteína habitual y barras de chocolate' ✅"

PASO 2: INTERPRETACIÓN (NLP + contexto del miembro)
  ARIA interpreta:
  - "proteína habitual" → busca en historial de compras del miembro
    → última compra: Whey Gold Vainilla 2lb · hace 18 días
  - "barras de chocolate" → busca en catálogo, sabor chocolate
    → encuentra: Barra Proteica Quest Bar Chocolate Chip · $3.50 c/u
    → "¿Cuántas barras? El sistema detectó que dijo 'una caja' → 12 barras"

PASO 3: CLARIFICACIÓN (si es necesario)
  ARIA: "Perfecto, Mari 😊 Encontré esto:

  1️⃣ Proteína Whey Gold Standard Vainilla 2lb
     Optimum Nutrition · $45.00
     (tu compra habitual del mes pasado)

  2️⃣ Barras Quest Chocolate Chip · $3.50 c/u
     ¿Cuántas barras quieres? ¿Una caja (12 unidades = $42.00)?

  Responde o di el número de unidades 😊"

PASO 4: CONFIRMACIÓN Y PAGO
  USUARIO: "Sí, 12 barras"

  ARIA: "¡Listo! 🛒 Tu pedido:

  • Whey Gold Vainilla 2lb ............. $45.00
  • Quest Bar Chocolate x12 ............$42.00
  ─────────────────────────────────────────────
  TOTAL: $87.00

  💳 Pagar con: Visa ****4521 (tarjeta guardada)
  📍 Retiro: Mostrador del gym (listo en 5 min)

  [✅ Confirmar pedido]  [✏️ Modificar]  [❌ Cancelar]"

  USUARIO: envía audio "Sí, confirma"
  o toca el botón [✅ Confirmar pedido]

PASO 5: PROCESAMIENTO
  Pago procesado → pedido confirmado → notificación al mostrador
  ARIA: "¡Pedido confirmado! 🎉 Número: #ORD-2891
         Tu pedido estará listo en el mostrador en ~5 minutos.
         Muestra este código al retirar: 🔑 2891"
```

### 5.2 Comandos de Voz Reconocidos

```yaml
Comandos naturales que ARIA entiende:

  Búsqueda:
    "¿Tienen [producto]?" → búsqueda en catálogo
    "¿Qué proteínas tienen?" → listado de categoría
    "¿Qué me recomiendas para perder peso?" → recomendaciones por objetivo
    "¿Cuánto cuesta [producto]?" → precio del producto
    "¿Está disponible [producto]?" → verificar stock

  Pedido:
    "Quiero pedir [producto]"
    "Dame [cantidad] de [producto]"
    "Lo mismo de la última vez"          → repetir último pedido
    "Lo de siempre"                      → ídem
    "Agrega [producto] a mi pedido"
    "Quita [producto] de mi pedido"
    "¿Qué tengo en el carrito?"

  Pago:
    "Págalo con mi tarjeta"
    "Ponlo a crédito"
    "¿Cuánto tengo de crédito disponible?"
    "¿Cuánto debo?"

  Consultas:
    "¿Qué diferencia hay entre [producto A] y [producto B]?"
    "¿Es bueno [producto] para [objetivo]?"
    "¿Tiene [producto] gluten?" / "¿Es vegano?"
    "¿Cuándo me llegó mi último pedido?"

  Seguimiento:
    "¿Ya está listo mi pedido?"
    "¿Dónde está mi pedido?"
    "Quiero cancelar mi pedido [número]"
```

---

## 6. CARRITO INTELIGENTE & CHECKOUT

### 6.1 Carrito de Compras

```
VISTA DEL CARRITO:
┌────────────────────────────────────────────────────────────┐
│  🛒 MI CARRITO (3 productos)                               │
├────────────────────────────────────────────────────────────┤
│  [foto] Whey Gold Vainilla 2lb                   $45.00    │
│         Optimum Nutrition                                  │
│         [-] 1 [+]                         [🗑️ Eliminar]   │
├────────────────────────────────────────────────────────────┤
│  [foto] Quest Bar Chocolate x12                  $42.00    │
│         Quest Nutrition · Caja de 12                       │
│         [-] 1 [+]                         [🗑️ Eliminar]   │
├────────────────────────────────────────────────────────────┤
│  [foto] BCAA 2:1:1 Powder 300g                   $22.00    │
│         MuscleTech · Sandía                                │
│         [-] 1 [+]                         [🗑️ Eliminar]   │
├────────────────────────────────────────────────────────────┤
│  💡 SUGERIDO PARA TI:                                      │
│  "Con tu compra, te recomendamos:                          │
│   Creatina Monohidrato 300g · $18.00  [+ Agregar]"        │
├────────────────────────────────────────────────────────────┤
│  🎟️ ¿Tienes un cupón?  [VERANO2026]        [Aplicar]      │
├────────────────────────────────────────────────────────────┤
│  Subtotal:                                       $109.00   │
│  Descuento cupón (-15%):                         -$16.35   │
│  ─────────────────────────────────────────────────────     │
│  TOTAL:                                           $92.65   │
│                                                            │
│  Tu saldo de wallet: $25.00                                │
│  [✅ Usar wallet → Pago restante: $67.65]                  │
├────────────────────────────────────────────────────────────┤
│           [🛒 Proceder al Checkout →]                      │
└────────────────────────────────────────────────────────────┘
```

### 6.2 Checkout Completo

```
PANTALLA DE CHECKOUT:

PASO 1: MÉTODO DE RETIRO
  ○ 🏪 Retirar en mostrador del gym
     Listo en: ~5-10 minutos después de confirmar
     Sin costo adicional

  ○ 📍 Entrega a domicilio (si el gym lo ofrece)
     Dirección: [campo + autocompletado con dirección registrada]
     Costo de envío: $3.00 (gratis en pedidos >$50)
     Tiempo estimado: 45-90 minutos

PASO 2: MÉTODO DE PAGO
  Seleccionar forma de pago:

  💳 Tarjeta guardada:
     ○ Visa ****4521 (principal)  [SELECCIONADA]
     ○ Mastercard ****8893
     [+ Agregar nueva tarjeta]

  💰 Wallet del gym: Saldo disponible $25.00
     [✅ Usar $25.00 del wallet + $67.65 en Visa]

  🏦 Crédito del gym: Disponible $100.00 / Límite $150.00
     Deuda actual: $50.00
     [Comprar a crédito — se suma a tu cuenta]

  💵 Efectivo en mostrador
     (Confirma el pedido ahora, paga al retirar)

PASO 3: RESUMEN FINAL
  ┌──────────────────────────────────────────────┐
  │  CONFIRMA TU PEDIDO                          │
  │                                              │
  │  Whey Gold Vainilla 2lb          $45.00      │
  │  Quest Bar Chocolate x12         $42.00      │
  │  BCAA 2:1:1 300g                 $22.00      │
  │  Descuento VERANO2026 (-15%)    -$16.35      │
  │  Wallet aplicado                -$25.00      │
  │  ──────────────────────────────────────────  │
  │  A COBRAR A VISA ****4521:       $67.65      │
  │                                              │
  │  📍 Retiro en mostrador | Listo ~5 min       │
  │  📄 Factura enviada a: maria@email.com       │
  │                                              │
  │  [✅ CONFIRMAR Y PAGAR]                      │
  └──────────────────────────────────────────────┘

CONFIRMACIÓN POST-PAGO:
  Pantalla de éxito con animación
  Número de orden: #ORD-2891
  QR de retiro (para mostrar al staff)
  Factura enviada a tu email
  ARIA notifica: "¡Pedido listo! Tu número es #2891 🎉"
```

---

## 7. SISTEMA DE PAGOS INTEGRADO

### 7.1 Métodos de Pago en el Marketplace

Todos los métodos se sincronizan con el Módulo de Billing (MOD-BIL):

```yaml
Métodos disponibles en el Marketplace:

  1. Tarjeta de crédito/débito guardada:
     - Las mismas tarjetas registradas para la membresía
     - Sin reingresar datos — pago en 1 toque
     - Cargo inmediato al confirmar el pedido
     - Factura generada automáticamente

  2. Wallet del gym:
     - Saldo disponible mostrado en tiempo real
     - Descuento automático del carrito
     - Pago mixto: wallet + tarjeta si el saldo no alcanza
     - Historial de movimientos del wallet integrado

  3. Crédito del gym:
     - Ver sección 8 completa
     - Disponible solo si el miembro tiene crédito aprobado
     - Límite visible en tiempo real
     - Al comprar a crédito: suma al saldo deudor del miembro

  4. Efectivo en mostrador:
     - El miembro confirma el pedido en la app
     - Paga en efectivo al retirar
     - El staff registra el pago en el POS y cierra la orden
     - Factura generada al registrar el pago

  5. Puntos de fidelidad (canje):
     - El miembro puede canjear puntos para descuentos o productos
     - Conversión: configurable por el gym (ej: 100 puntos = $1.00)
     - Canje parcial: puntos cubren parte, el resto en tarjeta
     - Productos elegibles para canje: configurables (no todos)

  6. Transferencia bancaria (para pedidos grandes):
     - Admin genera referencia de pago
     - Miembro transfiere y sube comprobante
     - Staff confirma manualmente la recepción
     - Proceso: más lento, para pedidos corporativos o de alto valor
```

### 7.2 Facturación Automática por Venta

```yaml
Al confirmar pago exitoso (automático, sin acción del admin):
  Genera:
    - Factura con número secuencial
    - Línea por cada producto con precio unitario y total
    - Descuentos aplicados claramente desglosados
    - Método de pago usado
    - Información fiscal del gym
    - QR de verificación de autenticidad

  Distribuye:
    - Email al miembro con PDF adjunto
    - Disponible en app → Mis Compras → [Ver factura]
    - Registrada en el sistema contable del gym

  Para crédito (orden a crédito):
    - Se genera documento de "Nota de Pedido a Crédito"
    - La factura definitiva se genera al liquidar la deuda
    - El cargo queda registrado en la cuenta corriente del miembro

  Para efectivo en mostrador:
    - La factura se genera cuando el staff registra el pago físico
    - El POS imprime recibo físico + envía factura digital
```

---

## 8. CRÉDITO EN CUENTA — GESTIÓN COMPLETA

### 8.1 Arquitectura del Sistema de Crédito

```yaml
Cuenta de crédito del marketplace:

  CONCEPTO:
    El gym extiende crédito al miembro para compras en el marketplace.
    El miembro compra hoy, paga después. El gym lleva la cuenta corriente.
    Es un beneficio de conveniencia — NO un producto financiero regulado.

  SEPARACIÓN DE CRÉDITOS:
    Crédito membresía: cobro de la mensualidad (módulo Billing)
    Crédito marketplace: compras en la tienda (este módulo)
    Ambos visibles por separado en el perfil del miembro y en el panel admin

  APROBACIÓN DE CRÉDITO:
    Por defecto: todos los miembros activos tienen crédito básico ($30 límite)
    El admin puede:
      - Subir el límite a miembros VIP/de larga data
      - Bajar o eliminar el crédito a miembros con historial de pago tardío
      - Aprobar crédito caso por caso

    Factores que el sistema considera para sugerir el límite:
      - Antigüedad en el gym: >6 meses → límite mayor
      - Historial de pago de membresía: sin fallos → límite mayor
      - Deuda actual de membresía: si debe → crédito marketplace reducido
      - Nivel de fidelidad (bronce/plata/oro/platino/elite):
          Bronce: $30 límite
          Plata:  $50 límite
          Oro:    $100 límite
          Platino:$200 límite
          Elite:  $300 límite + aprobación automática de extensiones

ESTRUCTURA DE LA CUENTA CORRIENTE:

    Estado de cuenta del miembro:
    ┌──────────────────────────────────────────────────────┐
    │  MI CUENTA DE CRÉDITO — TIENDA GYM                   │
    │                                                      │
    │  Límite aprobado:          $150.00                   │
    │  Saldo utilizado:           $87.50                   │
    │  DISPONIBLE PARA USAR:      $62.50                   │
    │                             ████████░░░░ 58%         │
    │                                                      │
    │  DEUDA ACTUAL:              $87.50                   │
    │  Vencimiento próximo:       30 de junio 2026         │
    │  Estado:                    ✅ Al día                 │
    │                                                      │
    │  [💳 Pagar mi deuda]  [📋 Ver historial]             │
    └──────────────────────────────────────────────────────┘
```

### 8.2 Ciclo de Cobro del Crédito

```yaml
Modalidades de cobro del crédito (configurables por el gym):

  MODALIDAD A — Cobro automático mensual:
    Fecha de corte: día configurable (ej: día 25 de cada mes)
    En la fecha de corte: se genera un cargo automático por la deuda total
    El cargo se suma a la siguiente factura de membresía
    O se cobra por separado a la tarjeta guardada
    Ejemplo: "El 25 de cada mes se cobra la deuda de tu cuenta de crédito"

  MODALIDAD B — Cobro por umbral:
    Cuando la deuda alcanza X% del límite (ej: 80%) → cobro automático
    O cuando la deuda supera $X (ej: $100) → cobro automático
    Ventaja: evita acumulación de deuda grande

  MODALIDAD C — Pago voluntario del miembro:
    El miembro paga su deuda cuando quiere desde la app
    El gym puede incentivarlo: "Paga tu deuda esta semana y recibe 50 puntos 😊"
    Sin cobro automático — el gym confiía en el miembro
    Con alertas automáticas de ARIA cuando se acerca el vencimiento

  MODALIDAD D — Mixta (recomendada):
    Pago voluntario del miembro en cualquier momento
    + Cobro automático en fecha de corte mensual si la deuda persiste
    + Suspensión si no hay pago después de X días
```

### 8.3 Estado de Cuenta Detallado

```
HISTORIAL DE CRÉDITO — María García
Período: Mayo–Junio 2026

FECHA       DESCRIPCIÓN                          CARGO    ABONO    SALDO
─────────────────────────────────────────────────────────────────────────
01/05/26    Saldo inicial del mes                                   $0.00
05/05/26    Whey Gold Vainilla 2lb               +$45.00          $45.00
12/05/26    Quest Bar Chocolate x12              +$42.00          $87.00
18/05/26    BCAA 2:1:1 300g                      +$22.00         $109.00
25/05/26 ★  COBRO AUTOMÁTICO (corte mayo)                 -$109.00  $0.00
03/06/26    L-Carnitina 3000mg 30 días           +$25.00          $25.00
08/06/26    Creatina Monohidrato 300g            +$18.00          $43.00
10/06/26    Barra Quest Vainilla x4              +$14.00          $57.00
─────────────────────────────────────────────────────────────────────────
SALDO ACTUAL:                                                      $57.00
Próximo corte:                                   25 junio 2026
Estado:                                           ✅ Al día

[💳 Pagar ahora]  [📄 Descargar estado de cuenta PDF]
```

---

## 9. SISTEMA DE SUSPENSIÓN DE CRÉDITO

### 9.1 Reglas Automáticas de Suspensión

```yaml
TRIGGERS DE SUSPENSIÓN AUTOMÁTICA:

  Nivel 1 — ALERTA (solo notificación, no suspensión):
    trigger: deuda supera 70% del límite de crédito
    acción:
      - Notificación push al miembro: "Tu crédito está al 70% de su límite"
      - ARIA WhatsApp: "Hola [nombre], quería avisarte que tu cuenta de
                        crédito en la tienda está en $X de $Y disponible.
                        ¿Quieres hacer un abono ahora? 😊"
      - Nada más — el miembro puede seguir comprando

  Nivel 2 — ADVERTENCIA (restricción parcial):
    trigger: deuda supera 90% del límite
    acción:
      - Solo se permiten compras pequeñas (< $10 por transacción)
      - Notificación: "Tu crédito está casi al límite. Solo puedes hacer
                       compras menores a $10 hasta hacer un abono."
      - ARIA envía recordatorio diario durante 3 días

  Nivel 3 — SUSPENSIÓN COMPLETA:
    triggers (cualquiera de estos):
      a) Deuda = 100% del límite
      b) Deuda no pagada después de X días del corte (configurable, ej: 15 días)
      c) 2 cobros automáticos fallidos consecutivos
      d) El admin suspende manualmente

    acción:
      - Crédito bloqueado inmediatamente: no puede comprar a crédito
      - Puede seguir comprando en efectivo/tarjeta/wallet
      - ARIA notifica con empatía (no con agresividad):
        "Hola [nombre], tu cuenta de crédito ha alcanzado su límite.
         Para seguir comprando a crédito, necesitas hacer un abono.
         ¿Puedo ayudarte a pagar ahora mismo? 😊
         [💳 Pagar mi deuda]  [📞 Hablar con alguien]"

  Nivel 4 — SUSPENSIÓN EXTENDIDA (deuda > 30 días):
    trigger: deuda sin pago durante 30 días post-corte
    acción:
      - Crédito suspendido
      - Alerta al admin con acción requerida
      - Posibilidad de incluir en próximo cobro de membresía
      - ARIA escala: el dueño/admin contacta directamente
      - Si en 15 días más no paga: puede afectar el acceso a la membresía
        (según política del gym — configurable)

  Nivel 5 — COBRO FORZADO:
    trigger: deuda sin resolver 45 días
    acción (opcional, configurable):
      - El sistema suma la deuda al próximo cobro de membresía
      - O el admin la cobra manualmente como transacción adicional
      - Documentado como "Cobro de deuda marketplace"
      - Si tampoco paga la membresía: proceso normal de recovery de membresía
```

### 9.2 Panel de Gestión de Crédito (Admin)

```
GESTIÓN DE CRÉDITO — PANEL ADMIN

RESUMEN CARTERA DE CRÉDITO:
  Total deuda activa del gym:    $1,847.50  (de 42 miembros)
  En estado normal (<70%):        $985.00  (28 miembros)
  En alerta (70-90%):             $547.50  (9 miembros)
  Suspendidos (>100% o vencido):  $315.00  (5 miembros) [REQUIEREN ACCIÓN]

MIEMBROS CON CRÉDITO SUSPENDIDO:
  #  Nombre           Deuda    Límite   Días vencido   Acción
  1  Carlos Mejía     $145.00  $150.00  18 días        [Contactar] [Ajustar]
  2  Ana Rodríguez     $98.00  $100.00  12 días        [Contactar] [Ajustar]
  3  Luis Pérez        $87.00   $50.00  25 días        [Cobrar hoy] [Suspender]
  ...

ACCIONES DISPONIBLES DESDE ESTE PANEL:
  ✅ Aumentar/reducir límite de crédito de un miembro
  ✅ Suspender/reactivar crédito manualmente
  ✅ Registrar pago manual (efectivo en mostrador)
  ✅ Generar estado de cuenta en PDF para el miembro
  ✅ Iniciar cobro forzado (suma a membresía)
  ✅ Agregar nota interna sobre la situación
  ✅ Exportar cartera completa para cobranza externa
```

### 9.3 Proceso de Reactivación del Crédito

```
REACTIVACIÓN DESPUÉS DE SUSPENSIÓN:

OPCIÓN A — Pago completo de la deuda:
  Miembro paga el 100% → crédito reactivado inmediatamente
  ARIA: "¡Excelente! Tu cuenta de crédito está activa de nuevo 🎉
         Límite disponible: $150.00. ¡Gracias por ponerte al día!"

OPCIÓN B — Pago parcial acordado:
  Miembro paga mínimo 50% → crédito reactivado con límite reducido temporalmente
  Al pagar el resto → límite vuelve al normal
  Admin puede configurar este umbral (30%, 50%, 70%)

OPCIÓN C — Plan de pago acordado:
  Admin acuerda con el miembro un plan de pago en cuotas
  Se registra en el sistema: montos y fechas de pago
  Si cumple → crédito se va reactivando progresivamente
  ARIA hace seguimiento automático de cada cuota

HISTORIAL DE SUSPENSIONES:
  Queda registrado en el perfil del miembro:
  "2 suspensiones de crédito en los últimos 12 meses"
  El sistema puede reducir automáticamente el límite futuro de miembros
  con historial de suspensiones frecuentes
```

---

## 10. FULFILLMENT — RETIRO EN MOSTRADOR & ENTREGA

### 10.1 Retiro en Mostrador (Principal)

```yaml
Flujo de retiro en mostrador:

  Post-pedido (cliente):
    - Recibe notificación con número de pedido y código QR
    - ARIA le dice estimado de tiempo (ej: "listo en ~5 minutos")
    - Cuando esté listo: notificación push + WhatsApp:
      "¡Tu pedido #2891 está listo para retirar! 🎉
       Muestra este código en el mostrador: 🔑 2891
       Te esperamos en recepción 😊"

  Proceso en mostrador (staff):
    - Pantalla dedicada en el POS: "Pedidos pendientes de entrega"
    - Staff recibe alerta de nuevo pedido con sonido configurable
    - Vista del pedido: qué productos, en qué ubicación del inventario
    - Staff prepara el pedido físicamente
    - Cuando listo: marca como "Listo para retirar" → notifica al miembro
    - Al llegar el miembro: escanea su QR o ingresa el código
    - Sistema confirma identidad y pedido
    - Staff entrega → confirma en sistema como "Entregado"
    - Si hay pago pendiente (efectivo): staff registra el cobro

  Para pedidos con crédito o efectivo:
    - El staff ve el método de pago en la pantalla
    - "Cobrar $87.00 en efectivo" o "Registrar en cuenta de crédito"
    - El POS emite el recibo/factura al registrar el pago
```

### 10.2 Entrega a Domicilio (Opcional)

```yaml
Entrega a domicilio (si el gym lo habilita):

  configuración:
    radio_de_entrega_km: 5           # área de cobertura
    costo_envio_base: $3.00
    envio_gratis_desde: $50.00       # monto mínimo para envío gratis
    tiempo_estimado_min: 45          # tiempo estimado en minutos
    horario_entregas: "08:00-20:00"

  integración con repartidores:
    - Repartidor propio del gym: asignado manualmente por el admin
    - Plataformas externas (futuro): Uber Direct, Rappi Business

  seguimiento en tiempo real:
    - El miembro recibe actualizaciones de estado:
      "Pedido preparado" → "Repartidor en camino" → "Entregado"
    - El repartidor confirma entrega desde su app/WhatsApp

  prueba de entrega:
    - Foto del repartidor al momento de entregar
    - Firma digital del receptor (si se requiere)
    - Registrada en el historial del pedido
```

### 10.3 Gestión de Órdenes — Estados

```
CICLO DE VIDA DE UNA ORDEN:

  PENDING_PAYMENT    → Pedido creado, pago en proceso
  PAYMENT_CONFIRMED  → Pago confirmado, notificación al mostrador
  PREPARING          → Staff marcó como "en preparación"
  READY_FOR_PICKUP   → Listo, notificación enviada al miembro
  DELIVERING         → En camino (si es entrega a domicilio)
  COMPLETED          → Entregado y confirmado por ambas partes
  CANCELLED          → Cancelado (con motivo: cliente / stock / pago fallido)
  REFUNDED           → Reembolsado (con nota de crédito generada)

TIEMPO MÁXIMO POR ESTADO (alertas si se supera):
  PENDING_PAYMENT → PAYMENT_CONFIRMED:  5 minutos
  PAYMENT_CONFIRMED → PREPARING:        10 minutos
  PREPARING → READY_FOR_PICKUP:         15 minutos
  READY_FOR_PICKUP (sin retirar):        2 horas → ARIA recuerda al miembro
```

---

## 11. MOTOR DE RECOMENDACIONES CON IA

### 11.1 Lógica de Recomendaciones Personalizadas

```yaml
El motor de recomendaciones considera 7 fuentes de datos:

  FUENTE 1 — Objetivo fitness del miembro:
    objetivo: perdida_de_peso
    → priorizar: proteínas magras, L-carnitina, termogénicos suaves,
                 barras bajas en azúcar, electrolitos
    → evitar sugerir: mass gainers, carbohidratos simples en exceso

    objetivo: ganancia_muscular
    → priorizar: proteínas con alto contenido proteico, creatina,
                 mass gainers, BCAA, glutamina, vitaminas B

    objetivo: definición
    → priorizar: proteínas lean, BCAA, quemadores, omega 3, multivitamínico

    objetivo: resistencia_cardiovascular
    → priorizar: energizantes naturales, electrolitos, beta-alanina,
                 carbohidratos de liberación sostenida

  FUENTE 2 — Plan nutricional activo:
    Si el nutricionista del gym le recetó "consumir 170g proteína/día"
    → calcular déficit de la dieta actual
    → recomendar suplemento de proteína en consecuencia

    Si el plan indica "evitar lactosa"
    → NO recomendar proteínas whey concentrado
    → Recomendar: veganas, egg protein, whey isolate (lactosa mínima)

  FUENTE 3 — Historial de compras:
    Última compra de proteína hace 28 días (duración típica: 30 días)
    → ARIA: "Tu proteína habitual debe estar acabándose 😊 ¿Repedimos?"

    Nunca ha comprado pre-entreno pero lleva 6 meses entrenando
    → "¿Has probado un pre-entreno? Con tu nivel de entrenamiento podría
       ayudarte a superar mesetas. ¿Quieres que ARIA te recomiende uno?"

  FUENTE 4 — Historial de entrenamiento (Módulo A):
    Si el miembro aumentó cargas un 30% en el último mes (gran progreso)
    → Recomendar: creatina, proteína extra, colágeno articular (para sostener)

    Si el miembro estuvo 2 semanas sin entrenar (freeze o inactividad)
    → Al retomar: recomendar BCAA para recuperación de músculo catabolizado

  FUENTE 5 — Comportamiento de compra de miembros similares:
    Filtro de cohorte: mismo objetivo, mismo nivel, mismo rango de tiempo
    "Miembros como tú que llevan 6 meses con objetivo de pérdida de peso
     también compran: L-Carnitina 3000mg · Omega 3 · Barra Proteica"

    Algoritmo: collaborative filtering (similar a Netflix/Spotify)

  FUENTE 6 — Temporada y contexto:
    Inicio de año: "Combos para empezar con todo 💪"
    Diciembre: "Packs de regalo para tus familiares fitness 🎁"
    Verano: "Suplementos para definición de cara al verano"
    Post-feriados: "Después de las fiestas, retoma con estos suplementos"

  FUENTE 7 — Stock y margen del gym (interno, no visible al miembro):
    Si hay sobrestock de un producto: aumentar su visibilidad en
    recomendaciones y home de la tienda
    Si un producto tiene alto margen: puede priorizarse en "Para ti"
    (con ética: solo si realmente es útil para el objetivo del miembro)
```

### 11.2 Combos Inteligentes

```
COMBOS SUGERIDOS POR OBJETIVO (ejemplos):

COMBO PÉRDIDA DE PESO — "Stack Quema":
  • Proteína Whey Lean 2lb                    $45.00
  • L-Carnitina 3000mg 30 días               $25.00
  • Multivitamínico Premium                   $18.00
  • Barras Proteicas x12 (sin azúcar)        $36.00
  ─────────────────────────────────────────────────
  Precio individual total:                  $124.00
  PRECIO COMBO:                              $99.00  ← -20%

  Badge: "Diseñado por nuestro nutricionista para pérdida de peso efectiva"

COMBO GANANCIA MUSCULAR — "Stack Masa":
  • Proteína Whey Gold 5lb                   $95.00
  • Creatina Monohidrato 300g                $18.00
  • BCAA 2:1:1 400g                          $28.00
  • Mass Gainer 6lb (si aplica)             $65.00
  ─────────────────────────────────────────────────
  Precio individual total:                  $206.00
  PRECIO COMBO:                             $165.00  ← -20%

COMBO PRINCIPIANTE — "Tu primer mes":
  • Proteína Whey Básica 2lb                 $38.00
  • Multivitamínico Starter                  $12.00
  • Shaker del gym personalizado             $10.00
  ─────────────────────────────────────────────────
  PRECIO COMBO BIENVENIDA:                   $45.00  ← -25%
  "Recomendado para nuevos miembros"
```

### 11.3 "Caja del Mes" — Suscripción Nutricional

```yaml
Caja del Mes (Subscription Box):

  descripción: selección curada mensual de suplementos/alimentos
               diseñada por el nutricionista del gym para cada objetivo

  precio: configurable (ej: $60/mes entregado / $55/mes retiro en gym)

  contenido:
    - 4-6 productos seleccionados por el nutricionista
    - Adaptada al objetivo del miembro (caja diferente para pérdida de peso
      vs. ganancia muscular vs. rendimiento)
    - Puede incluir productos nuevos para que pruebe
    - Siempre incluye una guía de uso mensual (PDF en la app)

  beneficios para el gym:
    - Revenue recurrente predecible (suscripción)
    - Reduce inventario de productos menos conocidos
    - Fideliza al miembro a través de la nutrición
    - El nutricionista puede personalizarla para cada miembro

  gestión:
    - El miembro se suscribe desde la app o con ARIA
    - Se cobra automáticamente el mismo día cada mes (billing integrado)
    - El miembro puede pausar un mes o cancelar en cualquier momento
    - El admin ve cuántas suscripciones activas hay y qué enviar en cada caja
```

---

## 12. PROGRAMA DE FIDELIDAD INTEGRADO

### 12.1 Puntos por Compras en el Marketplace

```yaml
Acumulación de puntos (integrado con Módulo I — Gamificación):

  Por cada $1 gastado en el marketplace: X puntos
    productos regulares: 10 puntos por $1
    productos destacados/nuevos: 20 puntos por $1 (doble)
    combos: 15 puntos por $1

  Bonificaciones especiales:
    Primera compra en el marketplace: +100 puntos bono
    Compra 3 veces en el mismo mes: +150 puntos
    Comprar el combo "diseñado por nutricionista": +200 puntos
    Reseña de un producto comprado: +25 puntos
    Recomendar un producto a un amigo que compra: +50 puntos

  Canje de puntos en el marketplace:
    100 puntos = $1.00 de descuento en tienda
    500 puntos = producto gratuito hasta $5 (lista de productos elegibles)
    1,000 puntos = 15% descuento en cualquier compra
    Canje mínimo: 100 puntos por transacción

  Motivación con ARIA:
    "María, te faltan solo 120 puntos para canjear $1.00 en tu próxima compra.
     Si agregas una Barra Quest a tu carrito, llegarás exactamente 😊"
```

---

## 13. PANEL DE GESTIÓN PARA EL PROPIETARIO

### 13.1 Gestión de Catálogo

```
PANEL ADMIN — PRODUCTOS:

  Herramientas disponibles:
  ✅ Agregar nuevo producto (formulario completo con todos los campos)
  ✅ Editar producto existente (incluyendo fotos, precio, stock)
  ✅ Importación masiva de productos (CSV/Excel con template descargable)
  ✅ Activar/desactivar producto (sin eliminar el historial)
  ✅ Duplicar producto (para crear variante rápidamente)
  ✅ Gestionar variantes: sabores, tamaños, colores
  ✅ Aplicar descuento a un producto o categoría completa
  ✅ Marcar como "Destacado", "Nuevo", "Más vendido"
  ✅ Ver historial de cambios de precio
  ✅ Ver qué miembros han comprado cada producto
  ✅ Generar etiqueta/sticker con código de barras para impresión
```

### 13.2 Gestión de Órdenes

```
PANEL ADMIN — ÓRDENES:

Vista principal:
  Filtros: estado | hoy | semana | mes | miembro | producto

  Lista de órdenes con:
  - Número de orden
  - Miembro (nombre + foto)
  - Resumen de productos (íconos)
  - Total
  - Método de pago (💳 tarjeta / 💰 wallet / 🏦 crédito / 💵 efectivo)
  - Estado con semáforo visual
  - Tiempo transcurrido desde la orden
  - Botones de acción rápida

  Acciones por orden:
  ✅ Marcar como "En preparación"
  ✅ Marcar como "Listo para retirar" → notifica automáticamente al miembro
  ✅ Marcar como "Entregado"
  ✅ Cancelar orden (con motivo) → reembolso automático si aplica
  ✅ Ver detalle completo
  ✅ Imprimir nota de entrega
  ✅ Ver factura generada

  Pantalla del mostrador (modo simplificado para la recepcionista):
  - Solo muestra órdenes "Listas para preparar" y "Listas para entregar"
  - Interfaz grande, táctil, sin distracciones
  - Alerta sonora cuando llega una nueva orden
```

### 13.3 POS — Punto de Venta en Mostrador

```yaml
Terminal POS del mostrador:

  Venta directa (sin orden previa del miembro):
    1. Staff busca producto: por código de barras (escaneo) o nombre
    2. Agrega al carrito de venta
    3. Busca al miembro: por nombre, QR de la app, teléfono
    4. Aplica descuentos si corresponde
    5. Selecciona método de pago
    6. Procesa la venta → genera factura → actualiza inventario

  Venta como walk-in (sin miembro registrado):
    - Para visitantes o familiares de miembros
    - Se puede vender sin asociar a un miembro
    - Factura como consumidor final

  Funcionalidades del POS:
    ✅ Apertura y cierre de caja (registro de monto inicial y final)
    ✅ Registrar pago en efectivo (cálculo de vuelto automático)
    ✅ Registrar pago con tarjeta (integrado con terminal física Stripe/MP)
    ✅ Aplicar descuento manual (con límite de % por rol del staff)
    ✅ Cancelar línea o cancelar venta completa
    ✅ Reimpresión de recibo
    ✅ Historial de ventas del turno actual
    ✅ Registro de devoluciones con motivo

  Arqueo de caja:
    Al final del turno: staff declara efectivo en caja
    Sistema calcula: ventas en efectivo del turno
    Diferencia: sobrante o faltante (con alerta si supera umbral)
    Reporte de turno generado para el admin
```

---

## 14. REPORTES & ANALYTICS DE VENTAS

### 14.1 Dashboard de Ventas en Tiempo Real

```
PANEL VENTAS — Hoy: 10 junio 2026

  💰 Ventas totales hoy:        $485.00
     Tarjeta:                   $312.00 (64%)
     Crédito gym:               $143.00 (30%)
     Efectivo/Wallet:            $30.00 (6%)

  📦 Órdenes del día:           18 órdenes
     Completadas:               15 ✅
     En proceso:                 2 🔄
     Pendientes de entrega:      1 ⏳

  🏆 Producto más vendido hoy:  Proteína Whey Gold 2lb (5 unidades)

  ⚠️ ALERTAS DE INVENTARIO:
     • Creatina Monohidrato: solo 3 unidades ← pedir hoy
     • BCAA 2:1:1 Sandía: sin stock desde ayer
```

### 14.2 Reportes Disponibles

```yaml
Reportes de ventas:

  Ventas por período:
    KPIs: ingresos brutos, netos, órdenes, ticket promedio, unidades vendidas
    Comparativa: vs. período anterior, vs. mismo período año pasado
    Filtros: canal (app/mostrador/ARIA), método de pago, categoría

  Ventas por producto:
    Top 20 más vendidos (unidades y revenue)
    Menos vendidos (candidatos a descontinuar)
    Margen bruto por producto
    Rotación de inventario (días promedio en stock)

  Ventas por miembro:
    Top compradores del mes (para programa VIP)
    Gasto promedio por tipo de membresía
    Comportamiento de re-compra (cuánto tardan en repetir)

  Cartera de crédito:
    Total deuda activa
    Antigüedad de saldos (0-30 / 30-60 / 60+ días)
    Tasa de recuperación mensual
    Proyección de cobro del próximo mes

  Rendimiento del inventario:
    Valor del inventario actual (a costo y a precio de venta)
    Productos con stock mínimo / crítico / agotado
    Mermas y ajustes del período
    Órdenes de compra sugeridas (basadas en rotación histórica)

  Performance del Marketplace por canal:
    % de ventas por canal: app / POS / ARIA / foto / voz
    Tasa de conversión: visitas al catálogo → compras
    Tiempo promedio entre vista del producto y compra
    Tasa de abandono del carrito (con los productos abandonados)

  ROI de combos y promociones:
    Revenue incremental por combo activo
    Descuentos otorgados vs. revenue generado
    Cupones: usos, descuento aplicado, revenue generado
```

---

## 15. INTEGRACIONES DEL MÓDULO

### 15.1 Integraciones Internas

```yaml
Con Módulo CRM / ARIA (MOD-CRM):
  - ARIA recibe contexto de compras para personalizar comunicaciones
  - Compras frecuentes alimentan el Risk Score (compras = engagement positivo)
  - ARIA puede iniciar una venta proactivamente basada en historial
  - Post-compra: ARIA hace seguimiento del uso del producto
    ("¿Cómo te fue con la proteína que compraste la semana pasada? 😊")

Con Módulo de Nutrición (MOD-C/D):
  - Información nutricional del producto disponible para el tracker
  - Al registrar consumo de un producto comprado:
    aparece automáticamente en el diario nutricional del miembro
  - El nutricionista ve qué suplementos está comprando el miembro
    para ajustar el plan si es necesario

Con Módulo de Membresías / Billing (MOD-MEM / MOD-BIL):
  - Descuentos de membresía (ej: Elite 10% off) aplicados automáticamente
  - Deuda de crédito visible y cobrable junto con la membresía
  - Wallet compartido (cargado en cualquier módulo, usado en cualquiera)
  - Historial financiero unificado en el perfil del miembro

Con Módulo de Gamificación (MOD-I):
  - Cada compra suma puntos de fidelidad
  - Medallas por hitos de compra (primera compra, 10 compras, etc.)
  - Los niveles de fidelidad afectan el límite de crédito
  - Puntos canjeables como descuento en el marketplace

Con Panel Ejecutivo (MOD-J):
  - Todas las métricas de ventas aparecen en el dashboard del dueño
  - Drill-down por miembro: qué compra, cuánto gasta, deuda activa
  - Alertas de inventario en el panel del admin
  - KPIs financieros del marketplace integrados al reporte mensual
```

### 15.2 Integraciones Externas

```yaml
Contabilidad:
  QuickBooks / Xero:
    - Cada venta genera asiento contable automático
    - Ingresos por categoría de producto
    - Cuentas por cobrar (deuda de crédito marketplace)
    - Inventario valorado en libros (costo promedio ponderado)

  DTE El Salvador (Ministerio de Hacienda):
    - Facturas de consumidor final (CF) y crédito fiscal (CCF)
    - Notas de crédito para reembolsos
    - Transmisión automática al MH según normativa vigente

Pasarelas de pago:
  Stripe y MercadoPago:
    - Cobros del marketplace usan los mismos métodos que la membresía
    - Un solo historial de transacciones por miembro
    - Conciliación automática diaria

Logística (futuro):
  Uber Direct / Rappi Business:
    - Integración para despacho de pedidos a domicilio
    - Tracking en tiempo real integrado en la app del miembro

Proveedores:
  Email/WhatsApp automático al proveedor:
    - Cuando stock llega al mínimo: email de alerta
    - Cuando se genera una orden de compra: envío automático al proveedor
    - Confirmación de recepción del pedido
```

---

## 16. FUNCIONES INNOVADORAS ADICIONALES

### 16.1 🤖 Asistente de Compra Proactivo — "Nunca te quedes sin tu suplemento"

```yaml
Sistema de re-orden predictiva:
  El sistema aprende el ciclo de consumo de cada miembro:
    - Proteína 2lb: el miembro la compra cada 28 días en promedio
    - BCAA 400g: cada 45 días
    - Creatina 300g: cada 60 días

  5 días antes de que se acabe (basado en la fecha de compra + ciclo):
    ARIA: 'Hola Mari 😊 Calculamos que tu Proteína Whey Gold se te
      va a acabar en unos 5 días. ¿Quieres que la repidamos?
      [✅ Sí, repedir igual]  [🔄 Ver otras opciones]  [No gracias]'

  Si el miembro dice "Sí":
    - Pedido creado automáticamente
    - Cobro con el método habitual
    - '¡Listo! Tu proteína estará lista en el mostrador hoy mismo 💪'

  Beneficio para el gym:
    - Revenue predecible y recurrente de productos
    - Mejor planificación de inventario
    - El miembro nunca se queda sin sus suplementos → mayor adherencia al plan
```

### 16.2 📊 Análisis Nutricional del Carrito

```yaml
Al momento del checkout, ARIA analiza el carrito:
  Si el carrito tiene productos que se complementan:
    '¡Buena elección! La creatina que agregaste funciona mejor
    si la tomas con carbohidratos. ¿Tienes ya una fuente de carbs?
    Te sugiero agregar: Maltodextrina 1kg · $15.00  [+ Agregar]'

  Si hay productos redundantes: 'Nota: Compraste 2 proteínas diferentes. Si quieres, ARIA te
    puede explicar la diferencia para que elijas la que mejor se
    adapta a tu objetivo 😊  [Preguntarle a ARIA]'

  Si hay incompatibilidades con restricciones registradas:
    'Atención: La proteína que seleccionaste contiene lactosa.
    Tienes registrada intolerancia a la lactosa en tu perfil.
    Te sugerimos: Whey Isolate 2lb · $52.00 (lactosa mínima)
    [Cambiar al Isolate]  [Mantener mi selección de todas formas]'

  Cálculo nutricional del carrito: 'Con estos productos, agregarías aproximadamente:
    +28g de proteína/día (si usas 1 servicio)
    Esto te ayudaría a alcanzar tu meta de 170g proteína diaria 💪'
```

### 16.3 🎁 Wishlist y Lista de Deseos

```yaml
Lista de deseos del miembro:

  El miembro puede:
    - Guardar productos para comprar después (sin agregar al carrito)
    - Compartir su wishlist con familiares (para regalos)
    - Recibir alertas cuando un producto en su wishlist baja de precio
    - Recibir alerta cuando un producto agotado vuelve a estar disponible

  ARIA usa la wishlist:
    "Oye Mari, el BCAA que guardaste en tu lista hace 2 semanas
     está ahora con 15% de descuento. ¿Lo añadimos al carrito? 🎉"

  Integración con cumpleaños:
    El gym puede compartir la wishlist del miembro con sus contactos
    registrados (con consentimiento) cuando se acerca su cumpleaños:
    "¿Sabes qué regalarle? Aquí está su lista de deseos del gym 🎁"
```

### 16.4 🔄 Suscripciones de Productos (Auto-Repedido Programado)

```yaml
El miembro puede programar repe pedidos automáticos:

  Configuración:
    "Envíame Whey Gold Vainilla 2lb cada 30 días"
    Fecha del primer envío: configurable
    Método de pago: el habitual

  El día programado:
    1. Sistema crea la orden automáticamente
    2. Notifica al miembro: "Tu suscripción mensual de Whey Gold está lista 📦"
    3. El miembro tiene 24 horas para cancelar si no quiere ese mes
    4. Si no cancela: se procesa el pago y la orden

  Gestión de la suscripción:
    - Pausar 1 mes (sin cancelar)
    - Cambiar producto o cantidad
    - Cambiar frecuencia
    - Cancelar en cualquier momento

  Descuento por suscripción:
    - 5% de descuento vs. precio de compra ocasional
    - Fideliza al miembro al producto del gym
    - Revenue predecible para el gym
```

### 16.5 🌐 Catálogo Público (Vitrina Web sin Login)

```yaml
Versión pública del catálogo:

  URL pública: gym.com/tienda
  Sin login: cualquier visitante puede ver el catálogo

  Funcionalidades públicas (sin login):
    - Ver productos, descripciones, precios
    - Ver combos y promociones vigentes
    - Leer reseñas de otros miembros
    - Ver disponibilidad de stock
    - Compartir producto en redes sociales

  Para comprar: se requiere ser miembro (login)
    Visitante intenta comprar → "Inicia sesión o regístrate como miembro"
    → Oportunidad de conversión de visitante a miembro
    → ARIA ofrece un trial gratuito: "¿Aún no eres miembro? Prueba 7 días gratis"

  SEO benefits:
    - Páginas de productos indexadas en Google
    - Meta tags con nombre, descripción, precio, disponibilidad
    - Genera tráfico orgánico hacia el gym
```

### 16.6 📸 Galería de "Resultados con Productos"

```yaml
Social proof integrado al marketplace:

  Los miembros pueden compartir:
    - Foto de su transformación con el producto que usaron
    - Rating y review del producto
    - "¿Cómo lo usé y qué resultado tuve?"

  Con consentimiento explícito: la foto puede aparecer en:
    - La página del producto (en la sección de reseñas visuales)
    - El feed social de la app
    - El blog del gym (con review completa)
    - Las redes sociales del gym (doble opt-in)

  Incentivo: +100 puntos por compartir foto de resultado con un producto

  Moderación: el admin revisa antes de publicar (igual que el blog)
```

### 16.7 🏷️ Etiquetado Inteligente por Restricción Dietética

```yaml
Sistema de filtros dietéticos:
  El miembro registra sus restricciones en su perfil: □ Vegano
    □ Vegetariano
    □ Sin gluten (celiaquía)
    □ Sin lactosa
    □ Sin maní / frutos secos
    □ Kosher
    □ Halal
    □ Bajo en sodio (hipertensión)
    □ Bajo en azúcar (diabetes)
    □ Sin cafeína

  El catálogo filtra automáticamente:
    - Los productos incompatibles aparecen con badge rojo ❌
    - Se puede activar un filtro global: 'Solo mostrar productos compatibles conmigo'
    - Al agregar un producto incompatible al carrito: ARIA advierte

  Los productos tienen tags validados por el nutricionista del gym: ✅ Vegano certificado
    ✅ Sin gluten (certificado)
    ⚠️ Puede contener trazas de maní
    ❌ Contiene lactosa
```

### 16.8 🤝 Compra Grupal / "Armemos el pedido"

```yaml
Compra grupal entre miembros del mismo gym:

  Un miembro inicia un pedido grupal:
    "Oye grupo, voy a hacer un pedido este viernes.
     Si alguien quiere agregar algo, tienen hasta el jueves 🎁"

  Proceso:
    1. Miembro A crea un "pedido grupal" en la app
    2. Comparte el link del pedido con otros miembros (WhatsApp/app)
    3. Cada miembro agrega sus productos + su método de pago
    4. En la fecha límite: el sistema procesa los pagos individuales
       y agrupa el pedido para optimizar el fulfillment
    5. Cada miembro recibe su parte en el mostrador

  Beneficio:
    - Si el pedido total supera $100: envío gratis para todos
    - Descuento grupal: pedidos de 3+ miembros = 5% off adicional
    - Genera comunidad entre miembros del gym
```

---

## 17. MODELO DE DATOS COMPLETO

### 17.1 Tablas Principales

```sql
-- ─────────────────────────────────────────────────────────────
-- PRODUCTOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE products (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  category_id           UUID REFERENCES product_categories(id),
  brand                 VARCHAR(100),
  supplier_id           UUID REFERENCES suppliers(id),
  name                  VARCHAR(200) NOT NULL,
  short_name            VARCHAR(100),
  sku                   VARCHAR(50) NOT NULL,
  barcode               VARCHAR(50),
  description_short     TEXT,
  description_long      TEXT,
  ingredients           TEXT,
  allergens             TEXT[],
  fitness_goals         TEXT[],         -- ['weight_loss','muscle_gain',...]
  dietary_tags          TEXT[],         -- ['vegan','gluten_free','lactose_free',...]
  nutrition_per_serving JSONB,          -- {calories, protein_g, carbs_g, fat_g, ...}
  serving_grams         DECIMAL(6,2),
  has_variants          BOOLEAN DEFAULT FALSE,
  base_price            DECIMAL(10,2) NOT NULL,
  sale_price            DECIMAL(10,2),
  sale_ends_at          TIMESTAMP,
  bulk_price            DECIMAL(10,2),
  bulk_min_qty          INTEGER,
  cost_price            DECIMAL(10,2),
  available_online      BOOLEAN DEFAULT TRUE,
  available_pos         BOOLEAN DEFAULT TRUE,
  available_on_credit   BOOLEAN DEFAULT TRUE,
  available_via_aria    BOOLEAN DEFAULT TRUE,
  is_active             BOOLEAN DEFAULT TRUE,
  is_featured           BOOLEAN DEFAULT FALSE,
  is_new                BOOLEAN DEFAULT FALSE,
  is_best_seller        BOOLEAN DEFAULT FALSE,
  search_keywords       TEXT[],
  rating_avg            DECIMAL(3,2) DEFAULT 0,
  rating_count          INTEGER DEFAULT 0,
  created_by            UUID REFERENCES staff(id),
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW(),
  UNIQUE (gym_id, sku)
);

-- ─────────────────────────────────────────────────────────────
-- VARIANTES DE PRODUCTO
-- ─────────────────────────────────────────────────────────────
CREATE TABLE product_variants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID NOT NULL REFERENCES products(id),
  sku_variant           VARCHAR(80) NOT NULL UNIQUE,
  attributes            JSONB NOT NULL,  -- {"sabor":"Vainilla","tamaño":"2lb"}
  price                 DECIMAL(10,2) NOT NULL,
  cost_price            DECIMAL(10,2),
  stock                 INTEGER NOT NULL DEFAULT 0,
  min_stock_alert       INTEGER DEFAULT 5,
  critical_stock        INTEGER DEFAULT 2,
  photo_url             TEXT,
  is_active             BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- INVENTARIO Y MOVIMIENTOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE inventory_movements (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  variant_id            UUID NOT NULL REFERENCES product_variants(id),
  movement_type         VARCHAR(20) NOT NULL, -- in|out|adjustment|return|expired
  quantity              INTEGER NOT NULL,
  stock_before          INTEGER NOT NULL,
  stock_after           INTEGER NOT NULL,
  unit_cost             DECIMAL(10,2),
  reference_type        VARCHAR(30),          -- order|purchase_order|adjustment|return
  reference_id          UUID,
  reason                VARCHAR(100),
  notes                 TEXT,
  created_by            UUID REFERENCES staff(id),
  created_at            TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- ÓRDENES DEL MARKETPLACE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE marketplace_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  order_number          VARCHAR(20) NOT NULL UNIQUE,
  member_id             UUID NOT NULL REFERENCES members(id),
  status                VARCHAR(30) NOT NULL DEFAULT 'pending_payment',
  -- Canal y método de pedido
  order_channel         VARCHAR(20) NOT NULL, -- app|pos|aria|voice|photo|web
  order_source_detail   VARCHAR(50),          -- 'whatsapp_photo'|'voice_command'|...
  -- Precios
  subtotal              DECIMAL(10,2) NOT NULL,
  discount_amount       DECIMAL(10,2) DEFAULT 0,
  coupon_code           VARCHAR(50),
  wallet_amount         DECIMAL(10,2) DEFAULT 0,
  points_redeemed       INTEGER DEFAULT 0,
  points_discount       DECIMAL(10,2) DEFAULT 0,
  total                 DECIMAL(10,2) NOT NULL,
  -- Pago
  payment_method        VARCHAR(20),           -- card|wallet|credit|cash|mixed
  payment_status        VARCHAR(20) DEFAULT 'pending',
  transaction_id        UUID REFERENCES transactions(id),
  credit_account_id     UUID REFERENCES member_credit_accounts(id),
  -- Fulfillment
  fulfillment_type      VARCHAR(20) DEFAULT 'pickup', -- pickup|delivery
  delivery_address      JSONB,
  pickup_code           VARCHAR(10),
  -- Fechas clave
  confirmed_at          TIMESTAMP,
  ready_at              TIMESTAMP,
  delivered_at          TIMESTAMP,
  cancelled_at          TIMESTAMP,
  cancellation_reason   TEXT,
  -- Staff
  prepared_by           UUID REFERENCES staff(id),
  delivered_by          UUID REFERENCES staff(id),
  -- Factura
  invoice_id            UUID REFERENCES invoices(id),
  -- Puntos
  points_earned         INTEGER DEFAULT 0,
  -- Metadata
  notes                 TEXT,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE TABLE marketplace_order_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES marketplace_orders(id),
  product_id            UUID NOT NULL REFERENCES products(id),
  variant_id            UUID REFERENCES product_variants(id),
  product_snapshot      JSONB NOT NULL,     -- nombre, sku, foto al momento de la compra
  quantity              INTEGER NOT NULL,
  unit_price            DECIMAL(10,2) NOT NULL,
  discount_amount       DECIMAL(10,2) DEFAULT 0,
  total_price           DECIMAL(10,2) NOT NULL,
  created_at            TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- CUENTA DE CRÉDITO DEL MARKETPLACE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE member_credit_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id             UUID NOT NULL UNIQUE REFERENCES members(id),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  credit_limit          DECIMAL(10,2) NOT NULL DEFAULT 30.00,
  current_balance       DECIMAL(10,2) NOT NULL DEFAULT 0,
  -- balance positivo = debe al gym
  available_credit      DECIMAL(10,2) GENERATED ALWAYS AS (credit_limit - current_balance) STORED,
  status                VARCHAR(20) DEFAULT 'active',
  -- active|warning|restricted|suspended|closed
  suspension_reason     TEXT,
  suspended_at          TIMESTAMP,
  suspended_by          UUID REFERENCES staff(id),
  -- Cobro
  billing_day           INTEGER DEFAULT 25,     -- día del mes para cobro automático
  last_billed_at        TIMESTAMP,
  -- Historial de suspensiones (count)
  suspension_count      INTEGER DEFAULT 0,
  -- Metadata
  notes                 TEXT,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE TABLE credit_account_movements (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_account_id     UUID NOT NULL REFERENCES member_credit_accounts(id),
  movement_type         VARCHAR(20) NOT NULL,  -- charge|payment|adjustment|reversal
  amount                DECIMAL(10,2) NOT NULL,
  balance_after         DECIMAL(10,2) NOT NULL,
  description           VARCHAR(255),
  reference_type        VARCHAR(30),            -- order|billing|manual_payment|...
  reference_id          UUID,
  days_overdue          INTEGER DEFAULT 0,
  created_by            UUID REFERENCES staff(id),
  created_at            TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- RESEÑAS DE PRODUCTOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE product_reviews (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID NOT NULL REFERENCES products(id),
  member_id             UUID NOT NULL REFERENCES members(id),
  order_item_id         UUID REFERENCES marketplace_order_items(id),
  rating                SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text           TEXT,
  result_photo_url      TEXT,
  is_verified_purchase  BOOLEAN DEFAULT TRUE,
  is_approved           BOOLEAN DEFAULT FALSE,
  approved_by           UUID REFERENCES staff(id),
  approved_at           TIMESTAMP,
  is_featured           BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMP DEFAULT NOW(),
  UNIQUE (product_id, member_id)
);

-- ─────────────────────────────────────────────────────────────
-- SUSCRIPCIONES DE PRODUCTOS (AUTO-REPEDIDO)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE product_subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id             UUID NOT NULL REFERENCES members(id),
  variant_id            UUID NOT NULL REFERENCES product_variants(id),
  quantity              INTEGER NOT NULL DEFAULT 1,
  frequency_days        INTEGER NOT NULL,    -- cada cuántos días
  next_order_date       DATE NOT NULL,
  status                VARCHAR(20) DEFAULT 'active', -- active|paused|cancelled
  payment_method_id     UUID REFERENCES payment_methods(id),
  total_orders          INTEGER DEFAULT 0,
  last_order_id         UUID REFERENCES marketplace_orders(id),
  paused_until          DATE,
  cancelled_at          TIMESTAMP,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- WISHLIST
-- ─────────────────────────────────────────────────────────────
CREATE TABLE product_wishlists (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id             UUID NOT NULL REFERENCES members(id),
  product_id            UUID NOT NULL REFERENCES products(id),
  variant_id            UUID REFERENCES product_variants(id),
  notify_price_drop     BOOLEAN DEFAULT TRUE,
  notify_back_in_stock  BOOLEAN DEFAULT TRUE,
  added_at              TIMESTAMP DEFAULT NOW(),
  UNIQUE (member_id, product_id, variant_id)
);
```

---

## 📎 APÉNDICE — CHECKLIST DE CONFIGURACIÓN DEL MARKETPLACE

```
CATÁLOGO Y PRODUCTOS:
□ Categorías y subcategorías creadas según el gym
□ Al menos 10 productos cargados con fotos, precios y stock inicial
□ Información nutricional cargada en productos de suplementos
□ Restricciones dietéticas etiquetadas en cada producto
□ Productos incompatibles con membresías especiales marcados

INVENTARIO:
□ Stock inicial ingresado para cada variante
□ Alertas de stock mínimo configuradas por producto
□ Al menos 1 proveedor cargado con datos de contacto
□ Ubicación física de productos en estantes documentada

CRÉDITO:
□ Límite de crédito global definido (por defecto para nuevos miembros)
□ Límites por nivel de fidelidad configurados
□ Modalidad de cobro elegida (automático / umbral / voluntario / mixto)
□ Día de corte mensual configurado
□ Reglas de suspensión configuradas (umbrales 70%/90%/100%)
□ Política de reactivación de crédito documentada

CANALES DE COMPRA:
□ Módulo de voz (ARIA) probado con comandos básicos
□ Módulo de foto/cámara probado con productos del catálogo
□ Escáner de código de barras calibrado con productos del gym
□ POS del mostrador configurado para el staff

PAGOS Y FACTURACIÓN:
□ Pasarelas de pago integradas y probadas (transacción de $1)
□ Factura electrónica generando correctamente con datos fiscales del gym
□ Integración contable configurada (QuickBooks/Xero/exportación)
□ DTE configurado si aplica (El Salvador)

INTEGRACIONES:
□ ARIA habilitada para recomendar y vender productos
□ Módulo de nutrición recibiendo datos de productos comprados
□ Puntos de fidelidad sumando correctamente por compras
□ Panel ejecutivo mostrando KPIs de ventas del marketplace
```

---

_Documento generado: Junio 2026_  
_Versión: 1.0_  
_Módulo: GYM-MOD-MKT_  
_Parte del Documento Maestro: App Integral de Gimnasio de Élite_  
_Próxima revisión: Septiembre 2026_
