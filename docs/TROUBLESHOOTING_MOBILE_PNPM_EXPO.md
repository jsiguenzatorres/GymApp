# Troubleshooting — pnpm + Expo en `apps/mobile` (monorepo)

Bitácora de una serie de fallos de build/resolución en `apps/mobile` causados por la misma raíz: **el layout de `node_modules` de pnpm (estricto, aislado por paquete) no coincide con lo que las herramientas de Expo asumen** (Metro y `expo-modules-autolinking` esperan algo más parecido al layout "plano" de npm/yarn clásico). Documentado para no repetir intentos que ya sabemos que no funcionan.

Regla general si algo similar vuelve a pasar: **antes de tocar código o reinstalar dependencias, sospecha primero de la resolución de módulos pnpm↔Expo** — es la causa raíz de todos los casos de abajo.

---

## Caso 1 — Metro no encontraba paquetes transitivos (`@expo/metro-runtime`, `expo-modules-core`, `invariant`, ...)

**Síntoma:** el bundler de Metro fallaba en tiempo de desarrollo/build con "Unable to resolve module X" para paquetes que **nuestro código nunca importa directamente** — los requiere internamente `expo`/`react-native`.

**Intento fallido:** `config.resolver.disableHierarchicalLookup = true` en `metro.config.js`. Esto se agregó para resolver un problema real (ver Caso 2 abajo), pero como efecto secundario le impide a Metro subir por el árbol de carpetas para encontrar paquetes anidados de pnpm — rompió la resolución de esos paquetes uno por uno, cada vez que Expo/RN pedía uno nuevo internamente. Cada vez que se "arreglaba" declarando el paquete como dependencia directa (commits `3b9d5aa`, `7a94f86`), aparecía otro roto.

**Por qué no funcionó:** es un parche reactivo — soluciona el síntoma actual pero no la causa, y hay una lista larga (no enumerada) de paquetes internos que eventualmente van a fallar igual.

**Fix real (commit `9c35d4e`, `3b9d5aa` revertido después):** quitar `disableHierarchicalLookup` y en su lugar usar `config.resolver.extraNodeModules` para forzar **solo** los paquetes genuinamente ambiguos (`react`, `react-dom`, `react-native` — mobile usa React 18, web usa React 19, y sin esto Metro podía subir hasta el `node_modules` raíz del monorepo y encontrar la copia equivocada) a la copia correcta del workspace de mobile. Todo lo demás vuelve a resolver con el lookup jerárquico normal de Metro.

```js
// apps/mobile/metro.config.js — estado actual, correcto
config.resolver.unstable_enableSymlinks = true;
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};
```

**Lección:** si Metro no encuentra un paquete que nadie importa directo, el problema casi seguro es de resolución pnpm, no que falte instalar algo. No declares cada paquete transitivo como dependencia directa uno por uno — es un parche sin fin. Y no bloquees el lookup jerárquico completo para resolver un problema de ambigüedad de UN paquete específico — usa `extraNodeModules` scopeado solo a ese paquete.

---

## Caso 2 — EAS Android build: `cannot find symbol: class ExpoModulesPackage, location: package expo.core`

**Síntoma:** el build de Android en EAS (perfil `preview`/`production`) fallaba siempre en la misma tarea, `:app:compileReleaseKotlin`, con ese error exacto en dos líneas del archivo **generado** `android/app/build/generated/autolinking/src/main/java/com/facebook/react/PackageList.java`. La clase real vive en `expo.modules.ExpoModulesPackage` (verificado localmente en `node_modules/expo/android/.../ExpoModulesPackage.kt`), no en `expo.core`.

Importante: `apps/mobile/android/` **no está en git** (`expo prebuild` la regenera en cada build de EAS desde cero) — así que no era un problema de caché de un folder nativo viejo comiteado por error.

### Intento fallido #1 — "caché vieja de EAS"

**Acción:** se hizo un bump de dependencias (commit `faf10ec`) para forzar una instalación limpia en el servidor remoto de EAS, y se corrió `eas build --clear-cache`.

**Resultado:** error idéntico, mismas líneas exactas.

**Por qué no funcionó:** el problema nunca fue una instalación vieja — es determinístico dado el mismo layout de `node_modules`. Ni el bump ni `--clear-cache` cambian ESO.

**Lección:** no gastes un ciclo de build de EAS (~15-20 min) en `--clear-cache` para este tipo de error sin antes verificar localmente que el contenido generado (`expo prebuild` local) realmente cambia con el fix que estás probando.

### Intento fallido #2 — excluir `expo` del autolinking nativo de Android (commit `5523a81`, revertido)

**Acción:** se agregó `apps/mobile/react-native.config.js` con:

```js
module.exports = { dependencies: { expo: { platforms: { android: null } } } };
```

La idea: si el autolinking nativo de RN genera mal el import de `expo`, que simplemente no lo autolinkee.

**Resultado:** desapareció el error de `PackageList.java`... pero apareció uno nuevo y distinto: `Unresolved reference: expo` en `MainActivity.kt` y `MainApplication.kt` — código fuente real de la app, no generado. Esos archivos importan directamente `expo.modules.ReactNativeHostWrapper` y `expo.modules.ApplicationLifecycleDispatcher`.

**Por qué no funcionó:** excluir un paquete del autolinking de Android no solo evita que se genere su entrada en `PackageList.java` — **también le quita a `:app` la dependencia de Gradle sobre ese paquete**. Como el código de la app importa clases de `expo` directamente (patrón estándar de Expo, no algo nuestro), quitar esa dependencia rompe la compilación de otra forma.

**Lección:** `react-native.config.js` → `platforms.android: null` es solo seguro para paquetes que el código de la app **no** importa directamente. Antes de usarlo, greppea si `MainActivity.kt`/`MainApplication.kt` (o cualquier `.kt`/`.java` del proyecto) importa algo de ese paquete.

### Fix real — commit `a5b9722`

**Causa raíz:** `expo-modules-autolinking` (el script que genera `PackageList.java`) asume que puede resolver `expo-modules-core` (y otros paquetes internos de Expo) con `require.resolve()` estilo npm/yarn clásico — un layout "plano". Con el aislamiento estricto por defecto de pnpm, esa resolución puede terminar encontrando una copia/versión distinta a la que `expo` realmente usa, generando el import viejo/incorrecto `expo.core.ExpoModulesPackage` (convención de una versión muy anterior de Expo, previa a la reestructuración de `expo-modules-core`).

**Fix:** `.npmrc` en la raíz del monorepo, forzando pnpm a _hoistear_ (subir al `node_modules` de nivel superior, layout plano) los paquetes específicos que la herramienta de autolinking necesita resolver así:

```ini
# .npmrc (raíz del monorepo)
public-hoist-pattern[]=*expo-modules-autolinking*
public-hoist-pattern[]=*expo-modules-core*
public-hoist-pattern[]=*babel-preset-expo*
```

Con esto, `expo prebuild`/Gradle generan correctamente `import expo.modules.ExpoModulesPackage;`. Build de EAS verde (`a5b9722`, perfil `preview`, 17m 25s).

**Lección:** cuando una herramienta de Expo (no nuestro código) falla en resolver otro paquete de Expo, sospecha de pnpm hoisting antes que de versiones/caché. Es un problema conocido y documentado en el ecosistema Expo+pnpm — la solución estándar es `public-hoist-pattern` (o `shamefully-hoist=true`, más agresivo, no usado aquí a propósito para no perder el aislamiento en el resto del monorepo).

---

## Checklist si algo similar vuelve a pasar

1. **¿El paquete que falla es interno de Expo/RN (nadie en nuestro código lo importa directo)?** → sospecha de resolución pnpm, no de código faltante.
2. **¿Es un error de Metro (bundling/dev)?** → revisa `extraNodeModules` en `metro.config.js` antes que `disableHierarchicalLookup`. No declares paquetes transitivos uno por uno.
3. **¿Es un error de Gradle/Kotlin en EAS (`cannot find symbol` sobre una clase de `expo.*`)?**
   - Verifica primero localmente corriendo `expo prebuild` en `apps/mobile` y leyendo el `PackageList.java` generado — es gratis y toma segundos, contra ~15-20 min por intento en EAS.
   - Si el import generado apunta a un paquete/ruta que no existe en `node_modules/expo/...`, es candidato a necesitar una entrada nueva en `public-hoist-pattern` dentro de `.npmrc` — **no** excluyas el paquete de `react-native.config.js` sin antes comprobar que el código de la app no lo importa directo.
4. **`eas build --clear-cache`** no arregla problemas de resolución pnpm — solo tiene sentido si sospechas de un artefacto de build genuinamente cacheado (poco probable, dado que `android/` se regenera siempre desde cero).
5. Si agregas un paquete `expo-*` nuevo al proyecto y ves errores de resolución parecidos, probablemente también necesite su propia entrada en `public-hoist-pattern`.
