# Diseño — Importar GPX → bitácora de caminata

**Fecha:** 2026-06-07
**Proyecto:** Senderismo Oso (PWA single-file)
**Feature:** Importar un archivo GPX (grabado con Wikiloc) a una ruta del catálogo, calcular distancia y desnivel, y mostrarlo con perfil de elevación + mapa del recorrido.

## Contexto y decisión

Andrés hizo su primera caminata y quiere registrar km recorridos y metros de subida. Se descartó tracking GPS en vivo dentro de la PWA porque iOS Safari corta `watchPosition` con pantalla apagada / en background, y construir un app nativo desde Windows no es viable (necesita Mac + caduca a 7 días con firma gratis).

**Flujo elegido:** Wikiloc graba la ruta (GPS satélite, funciona offline en el bosque, pantalla apagada, mapas offline gratis) → Andrés exporta el `.gpx` → lo importa a Senderismo Oso, que parsea, calcula y guarda en la bitácora de la ruta.

La restricción "offline en el bosque" aplica solo a **grabar** (lo hace Wikiloc). Ver el resultado en Senderismo Oso ocurre en casa con wifi, por eso el mapa real (Leaflet, tiles online) es aceptable.

## Alcance

- Importar GPX a una ruta del catálogo.
- Calcular: distancia (km), subida acumulada (m), bajada acumulada (m), duración, altitud máx/mín.
- Mostrar: tarjeta de stats + perfil de elevación (SVG) + mapa del recorrido (Leaflet).
- Persistir en localStorage por ruta.
- Badge resumen en la card del catálogo si la ruta tiene track.

**Fuera de alcance (YAGNI):** tracking en vivo, comparar tracks, exportar, sincronizar, app nativo, knee-check/bitácora subjetiva (eso es feature aparte ya documentado en Improvements.md).

## Modelo de datos

Nuevo campo opcional por ruta en `STATE.rutas[id]`:

```js
STATE.rutas[id].track = {
  km,            // Number, distancia total
  ascentM,       // Number, subida acumulada (m) — null si el GPX no trae <ele>
  descentM,      // Number, bajada acumulada (m) — null si sin <ele>
  durMin,        // Number, duración en minutos — null si el GPX no trae <time>
  maxAlt,        // Number — null si sin <ele>
  minAlt,        // Number — null si sin <ele>
  importedAt,    // ISO string
  fileName,      // String, nombre del archivo importado
  profile,       // [[distKm, altM], ...] submuestreado ~120 pts (para el SVG). [] si sin <ele>
  path,          // [[lat, lng], ...] submuestreado ~400 pts (para el mapa)
  bounds         // [[minLat,minLng],[maxLat,maxLng]] para fitBounds
}
```

Se guarda resumen + polilíneas submuestreadas, **no** el track crudo (~400 pts ≈ pocos KB; a escala de mapa de teléfono no se ve diferencia con 10k pts crudos).

## Almacenamiento: localStorage + Gist sync

localStorage es la **fuente de verdad local** (instantáneo, offline). Encima, una capa de **sync a GitHub Gist** da backup en la nube y continuidad entre dispositivos / reinstalaciones de la PWA.

### Seguridad del token (crítico)
- El token (PAT de GitHub) **nunca** va en el código ni en el repo. Repo público = hardcodear token sería exponerlo a todos.
- El usuario pega el token en una pantalla de **ajustes dentro de la app**. Se guarda solo en `localStorage` (`gh_pat`) de su dispositivo.
- Token recomendado: **fine-grained**, permiso **solo "Gists" read/write** (mínimo privilegio). Revocable desde GitHub.
- Sin token configurado → la app funciona igual con solo localStorage (el sync queda inactivo, degradación limpia).

### Modelo de sync
- Un gist privado guarda un único archivo `senderismo-oso-state.json` con el `STATE` completo.
- Claves en localStorage: `gh_pat` (token), `gist_id` (id del gist), `state_updated_at` (ISO del último cambio local).
- **Carga (app start):** si hay token + gist_id → `GET` gist. Merge **last-write-wins** por `state_updated_at` (el más reciente gana, local vs remoto). Sin red → usa localStorage.
- **Guardado:** cada `saveState()` actualiza `state_updated_at` y agenda un `PATCH` al gist **debounced** (~3 s) para no llamar la API en cada toque. Falla/offline → reintenta al próximo cambio o al volver online (`online` event).
- **Primer uso con token:** si no hay `gist_id`, `POST` crea el gist privado y guarda su id.
- Conflictos: usuario único → last-write-wins basta. No merge a nivel de campo.
- Errores de API (401 token malo, red caída) → aviso no intrusivo en ajustes; localStorage sigue intacto.

### UI de ajustes
- Icono/entrada "Sync" (engranaje) → modal: campo para pegar token, botón "Conectar", estado ("Conectado · último sync hh:mm" / "Sin conectar"), botón "Desconectar" (borra `gh_pat` local), enlace a instrucciones para crear el token.

## Componentes (todo en index.html, JS puro)

### 1. `parseGPX(text) → { points }`
- `DOMParser` sobre el texto. `querySelectorAll("trkpt")`.
- Cada punto: `{ lat, lng, ele, time }` leyendo atributos `lat`/`lon` y nodos hijos `<ele>`, `<time>`.
- Soporta múltiples `<trkseg>` (concatena).
- Si no hay `trkpt`, lanza error controlado → UI muestra "archivo sin recorrido".

### 2. `computeTrack(points) → track`
- **Distancia:** suma de haversine entre puntos consecutivos.
- **Subida/bajada:** suma de deltas de altitud positivos/negativos, con **umbral de ruido** `MIN_ELE_DELTA = 4` m (acumula solo cuando el cambio neto supera 4 m respecto al último punto "anclado") → evita metros fantasma del GPS. Si ningún punto trae `ele` → ascentM/descentM/maxAlt/minAlt = null.
- **Duración:** `time` último − primero, en minutos. null si sin `time`.
- **profile:** submuestreo uniforme a ~120 pts de `[distAcumKm, alt]`.
- **path / bounds:** submuestreo uniforme a ~400 pts de `[lat,lng]` + bounds.

### 3. `importGPXForRoute(id, file)`
- Lee el archivo con `FileReader` (text).
- `parseGPX` → `computeTrack` → guarda en `STATE.rutas[id].track` → `saveState()` → re-render modal y card.
- try/catch: error → alerta inline en la sección, no rompe el modal.

### 4. UI en el modal (`openModal`)
Nueva sección "Mi caminata" (después del clima, antes de Cerrar):
- **Sin track:** botón "Importar GPX" con `<input type="file" accept=".gpx,application/gpx+xml" hidden>`.
- **Con track:** tarjeta `.wx-card` reutilizando estilo existente:
  - Línea stats: `↔ 8.2 km · ↑ 420 m · ↓ 410 m · ⏱ 2h45 · cima 2480 m` (omite los null con "n/d").
  - Perfil de elevación: SVG inline (área esmeralda bajo la curva). Solo si `profile.length`.
  - Mapa: `<div id="trackMap">` renderizado por Leaflet (ver abajo). Solo si `path.length`.
  - Botón "Reemplazar GPX".

### 5. Mapa Leaflet
- Leaflet vía CDN (`<link>` CSS + `<script>` JS en `<head>`).
- Init **lazy**: al abrir el modal de una ruta con `track.path`, crear el mapa, polilínea esmeralda (`#10B981`), marcadores inicio/fin, `fitBounds(track.bounds)`.
- `map.invalidateSize()` tras abrir el modal (contenedor recién visible).
- Tiles OpenStreetMap (sin API key). Offline → tiles grises + nota "mapa necesita conexión"; stats y perfil siguen visibles.
- Destruir/recrear el mapa al cambiar de ruta (evitar fugas).

### 6. Badge en card del catálogo (`cardHTML`)
- Si `STATE.rutas[id].track` existe: chip pequeño `✓ 8.2km ↑420m` en la card.

## Constantes nuevas
- `MIN_ELE_DELTA = 4` (m, umbral ruido)
- `PROFILE_PTS = 120`, `PATH_PTS = 400` (submuestreo)
- URLs Leaflet CDN (CSS + JS), versión fija.

## Service Worker
- Bump `CACHE` v7 → v8.
- Agregar Leaflet CSS + JS (CDN) a la lista de precache para que la librería cargue offline (los **tiles** seguirán necesitando red — limitación inherente, aceptable).
- `api.github.com` → network-only (no cachear, como ya se hace con open-meteo).

## Errores y degradación
- GPX sin `<trkpt>` → "archivo sin recorrido", no guarda.
- GPX sin `<ele>` → guarda km + duración; desnivel "n/d"; sin perfil; mapa sí.
- GPX sin `<time>` → duración "n/d"; resto OK.
- Leaflet no carga / offline → mapa gris + nota; stats y perfil intactos.
- Parse/cálculo falla → alerta inline, modal no se rompe.

## Sin cambios
- `data/rutas.json` (catálogo), lógica de filtros/estados/clima, comparador, calendario. Feature aislado y aditivo.

## Verificación pendiente (Andrés)
- Importar un GPX real de Wikiloc y confirmar km/desnivel coherentes con lo que reporta Wikiloc.
- Confirmar mapa visible en iPhone tras `Ctrl+Shift+R` / reinstalar PWA (SW v8).
- Crear token fine-grained (solo Gists), pegarlo en ajustes, confirmar sync (marcar ruta en un dispositivo → aparece en otro).
