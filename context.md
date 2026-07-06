# Context — Senderismo Oso

_Handoff entre sesiones. Estado operativo (qué hacer). Para qué es el proyecto → ver [README.md](README.md)._

## Estado actual (2026-06-07)

**Sesión 2026-06-07 (GPX import + bitácora + Gist sync) — pusheado a main `3f3878f`. SW v7→v8 (cache `senderismoso-v8`). OJO: remote renombró el proyecto "Senderismo Oso → Senderismoso" (`add0d79`); rebaseé encima, resolví conflicto sw.js.**

Andrés hizo su 1ª caminata, quiere registrar km + desnivel. Brainstorm completo (spec en `docs/superpowers/specs/2026-06-07-gpx-import-bitacora-design.md`, commiteado).

- **Decisión clave:** tracking GPS en vivo NO sirve (iOS Safari corta `watchPosition` con pantalla apagada; app nativo inviable desde Windows). Flujo elegido: **graba con Wikiloc** (GPS offline, pantalla apagada, mapas offline gratis, export GPX 1-toque) → **importa el .gpx a Senderismo Oso**.
- **Feature importar GPX** (todo en index.html, JS puro):
  - `parseGPX(text)` DOMParser sobre trkpt (fallback rtept), lee lat/lon/ele/time.
  - `computeTrack()`: distancia haversine; subida/bajada con **umbral ruido `MIN_ELE_DELTA=4`m** (evita metros fantasma GPS); duración; cima/min alt; submuestreo `profile` 120pts + `path` 400pts + bounds. Guarda en `STATE.rutas[id].track`.
  - Modal: sección "Mi caminata" → botón Importar/Reemplazar/Quitar; tarjeta stats `↔km ↑↓m ⏱ cima`; perfil elevación SVG (`elevationSVG`); mapa **Leaflet** (tiles OSM, polilínea esmeralda, marcadores inicio/fin, fitBounds). Badge `route` en card del catálogo.
  - Leaflet vía CDN unpkg 1.9.4 **con SRI** (sha256). `let trackMap` global, `.remove()` en closeModal/reopen.
  - Verificado: `node --check` JS+SW OK; `computeTrack` con track sintético da km/subida/duración correctos (ruido filtrado).
- **Gist sync (storage):** localStorage = fuente local; capa opcional sync a **GitHub Gist privado** (`senderismo-oso-state.json`).
  - **Token NUNCA en código/repo** — se pega en UI de ajustes (gear en header), vive solo en `localStorage[gh_pat]` del dispositivo. Andrés dijo "te paso el token" → se le frenó (no en chat, no en repo).
  - `STATE._updated` ISO timestamp; **last-write-wins** (`syncPull` trae si remoto más nuevo); `pushNow` PATCH/POST debounced 3s; reintento en evento `online`. Token fine-grained, permiso solo Gists.
  - `saveState(opts)` ahora setea `_updated` + agenda push (skipStamp/skipSync para evitar loop en pull).
- **SW v8:** precache Leaflet CSS/JS; `api.github.com` + `tile.openstreetmap.org` + open-meteo = network-only.
- **PENDIENTE Andrés (navegador real):**
  1. Ctrl+Shift+R / reinstalar PWA (tomar SW v8).
  2. Importar un GPX real de Wikiloc → confirmar km/desnivel coherentes + mapa visible en iPhone.
  3. Crear token fine-grained (solo Gists), pegarlo en gear → confirmar sync entre dispositivos.

### Estado anterior (2026-06-02)

**Sesión 2026-06-02 (clima Open-Meteo) — `127fc92` + `8dfc2bb` (pusheado a main). SW v5→v7:**

- **`127fc92`** feat base: pronóstico en modal.
  - `index.html`: `const COORDS` (58 ubicaciones, lat/lng municipios) + `resolveCoords()` (tokeniza por `/,()-`, normaliza acentos NFD, prueba cada token contra COORDS) + `getWeather()` + `loadWeather(r)` en openModal.
  - Regla visibilidad: clima solo si `fecha_inicio` en próximos 16 días Y no pasada Y coords match → spinner `.wx-spin` → render. Falla/sin coords → silencio (no rompe modal).
  - `sw.js`: open-meteo network-only (no cachear forecast). SW v5→v6.
- **`8dfc2bb`** feat detalle (Andrés pidió saber si sol/lluvia y a qué hora):
  - `getWeather()` ampliado: `daily=weather_code,temp_max,temp_min,precip_sum,precip_probability_max,wind_max` + `hourly=precipitation,weather_code`; tz America/Bogota.
  - `wmoDesc(code)` → [descripción es, emoji] (mapa WMO completo). `franjaNombre(h)` madrugada/mañana/tarde/noche. `rangosLluvia(times,precs)` → franjas + rangos horarios "7–10h, 15–17h" (lluvia ≥0.2mm/h, contiguos).
  - Render tarjeta `.wx-card`: veredicto (¿llueve o seco?: prob≥50 ó mm≥1 ó code 51-99), máx/mín, % prob + mm + cuándo, viento. CSS `.wx-card/.wx-title/.wx-head/.wx-line/.wx-note`. SW v6→v7.
- **NO verificado en navegador con API real:** entorno dev sin salida HTTPS (curl err 35 a api.open-meteo.com, incluso fuera de sandbox). Verificado por proxy: JS+SW syntax OK (`node --check`), resolver cubre 58/58 ubicaciones, render simulado con datos de ejemplo OK, params URL = spec Open-Meteo. **Pendiente Andrés:** Ctrl+Shift+R (tomar SW v7) + abrir modal de ruta próxima (ej. Cocorná) y confirmar tarjeta de clima en navegador real.

App PWA desplegada y funcional. Catálogo Junio 2026 con **86 rutas** normalizadas, 4 operadoras:
- `atp` A Todo Pulmón — 27
- `ea` Caminantes 2.0 — 22
- `eyt` Entre Yarumos Travels — 12 (extraídas de flyers Instagram)
- `vdc` Vámonos de Caminata — 25 (extraídas de catálogo WhatsApp Business, incl. 5 expediciones multidía)

**Sesión 2026-06-02 — `7042d35` (pusheado a main):**
- +eyt (12 rutas) +vdc (25 rutas junio). Compañías nuevas en `data/rutas.json`.
- Chips de filtro + subtítulo header para ambas operadoras.
- Fix: slider precio `max` 900k→2.6M (las 5 expediciones vdc >$900k quedaban ocultas por el cap default → mostraba 81/86). 5 puntos en index.html actualizados.
- SW cache v4→v5.
- **Cómo se extrajo vdc:** proyecto hermano `../Whatsapp_AltaComedia` (Baileys). Se le añadió endpoint `GET /catalog?to=<tel>` (server.js, **cambio sin commitear allá**) que usa `getBusinessProfile`+`getCatalog`+`getCollections`. El catálogo venía en `getCollections` (no en `getCatalog.products`, que dio vacío). Negocio: tel `573105996971`, RNT 116691. Precio = campo `priceAmount1000`/1000.
- Niveles decimales de operadoras snapeados a buckets {2,2.5,3,3.5,4}; `nivel_original` conserva texto literal. PFPS warning (nivel≥4) en 5 rutas vdc.

### Estado anterior (2026-05-29)

Rediseño visual "Bosque Profundo + Glass" aplicado y en producción.

**Rediseño visual aplicado y en producción (2026-05-29)** — tema "Bosque Profundo + Glass" del design system de Claude Design. Solo CSS/head + helper de íconos (JS de lógica intacto):
- Paleta lila → esmeralda `#10B981` + dorado solar `#FBBF24` sobre verde-negro `#07120d`
- Fuentes Google: Sora (display) / Manrope (UI) / JetBrains Mono (stats)
- Glass (backdrop-blur) en header, bottom-bar y modal; cards SÓLIDAS (legibilidad)
- Motion: fade-in cards, modal slide-up, pulse en warning PFPS nivel ≥4 — todo con prefers-reduced-motion
- Íconos UI → Lucide inline (helper `ICON()`); emojis solo en texto export/share
- Icono PWA + manifest + theme-color → montaña esmeralda + sol dorado
- `sw.js` cache `v4` (bumpeado cada cambio para forzar redeploy del SW cache-first)
- Assets marca en `assets/` (icon-app.svg, logomark.svg, wordmark.svg)

Confirmado en navegador por Andrés (vio overflow del botón "Confirmada" → ya fixeado en `51f385a`). Rediseño live OK.

- **Repo:** https://github.com/AndresLoaiza/senderismo-oso
- **App live:** https://andresloaiza.github.io/senderismo-oso/
- **Último commit:** `8dfc2bb` — clima detallado en modal (SW v7). Antes: `127fc92` clima base, `7042d35` rutas junio eyt+vdc, `51f385a` fix overflow. Pusheado a main 2026-06-02.
- **Nota:** `context.md` NO se commitea (repo público + contiene info personal PFPS/vaults). Solo app + assets.
- **Local dev:** `python -m http.server 8000` desde la raíz

## Stack

- Single-file HTML+CSS+JS PWA (mismo patrón que `gym-oso`)
- `data/rutas.json` — catálogo normalizado
- `sw.js` cache offline-first
- `manifest.json` PWA instalable
- Tema dark biophilic: esmeralda `#10B981` + dorado `#FBBF24` sobre verde-negro `#07120d` (ver sección Design system)

## Decisiones tomadas

- Escala nivel unificada 1-5 (BAJO=2, MEDIO BAJO=2.5 confirmado por Andrés)
- Umbral PFPS warning: nivel ≥ 4 = rojo + bastones obligatorios
- Filtros multi-toggle: nivel (1, 2, 2.5, 3, 3.5, 4, 5) + día semana (L-D)
- Vistas: Catálogo, Calendario mes, Comparador (max 3)
- Estados ruta persistentes localStorage: interés / planeada / confirmada / hecha / descartar
- Repo público, PDF original ignorado en `.gitignore`

## Pendientes

- [ ] Cargar programación Julio 2026 cuando salgan flyers
- [ ] Refotografiar/actualizar precios al inicio de cada mes
- [ ] (Opcional) Slider filtro por km máx
- [ ] (Opcional) Bitácora post-ruta con knee-check (cruza con [app-gym](https://github.com/AndresLoaiza/gym-oso))
- [ ] (Opcional) Sync con calendar / export ICS
- [x] Clima pronóstico Open-Meteo en modal de ruta (HECHO 2026-06-02, `127fc92`) — falta confirmar en navegador real
- [x] Swap emojis UI → Lucide inline (HECHO 2026-05-29): helper `ICON(name,size)` + `ICON_PATHS` en script. Cubre header (mountain), nivel ≥4 chips (alert), search (search), card warning/compare/km/pin/star/calendar/check/flag/x, comparador + modal. Emojis SOLO quedan en texto de exportación (líneas ~693/700/711 — share plaintext, intencional)
- [ ] (Opcional) Cargar fuentes locales offline (hoy vía Google Fonts @import; PWA offline cae a system stack)

## Blockers

Ninguno.

## Notas técnicas

- `file://` no funciona — fetch del JSON requiere servidor. Levantar con `python -m http.server 8000`.
- Service Worker cache-first agresivo. Tras cambios: bump `CACHE` en `sw.js` (vN→vN+1, hoy en v4) + Ctrl+Shift+R / Unregister en DevTools / reinstalar PWA iPhone. Sin bump, el SW viejo sigue sirviendo cache aunque disco cambie.
- GitHub Pages tarda 1-3 min en redeploy tras push.
- Dev local: verificar puerto 8000 antes de relanzar (`Get-NetTCPConnection -LocalPort 8000`). Server corre como background, puede sobrevivir entre sesiones.

## Design system

- Origen: bundle de Claude Design (claude.ai/design) → `https://api.anthropic.com/v1/design/h/ASE06HUvF05y5vxQmBl8ZA` (gzip/tar, link puede expirar)
- Brief + tokens completos en chat transcript del bundle. Resumen aplicado arriba.
- Spec key: glass SOLO en chrome flotante, cards sólidas, motion solo transform/opacity 180-300ms, contraste texto ≥4.5:1.
- Assets de marca en `assets/`. Para regenerar mocks/slides, el bundle traía `ui_kits/pwa/` (React) + `SKILL.md` (`senderismo-oso-design`).

## Vault relacionado

- [[../obsidian_vaults/vida_personal/senderismo.md]] — estado de proyecto + escala niveles
- [[../obsidian_vaults/vida_personal/perfil.md]] — Andrés tiene PFPS, prep trekking nivel 4
- [[../obsidian_vaults/vida_personal/app-gym-trekking.md]] — proyecto hermano que comparte tema PFPS
