# Improvements — Senderismo Oso

## Contexto
PWA single-file. 46 rutas normalizadas (26 ATP + 20 Caminantes 2.0). Filtros, estados, comparador. Rediseño emerald aplicado. Desplegada en GitHub Pages.

---

## Mejoras por prioridad

### 🔴 Alta prioridad

#### 1. Fuentes offline (pendiente documentado)
**Problema:** Sora y Manrope se cargan desde Google Fonts. Si no hay conexión, el diseño emerald cae a system fonts y se ve diferente.  
**Solución:** hospedar las fuentes localmente igual que App Gym.

```html
<!-- index.html — reemplazar @import de Google Fonts por: -->
<style>
@font-face {
  font-family: 'Sora';
  src: url('fonts/Sora-Regular.woff2') format('woff2');
  font-weight: 400; font-display: swap;
}
@font-face {
  font-family: 'Sora';
  src: url('fonts/Sora-Bold.woff2') format('woff2');
  font-weight: 700; font-display: swap;
}
/* Igual para Manrope */
</style>
```

Descargar woff2 de Google Fonts (herramienta: `google-webfonts-helper.herokuapp.com`). Agregar a `sw.js` precache list. Bump versión cache.

---

#### 2. Cargar programación Julio 2026
**Pendiente documentado.** Cuando salgan los flyers de ATP y Caminantes 2.0 para julio, agregar las nuevas rutas a `data/rutas.json` con el formato normalizado existente.

---

### 🟡 Media prioridad

#### ~~3. Pronóstico del tiempo con Open-Meteo~~ ✅ HECHO (2026-06-02)
`COORDS` hardcoded en index.html (~25 municipios). `getWeather()` en modal de ruta. Solo rutas próximas 16 días. Degradación silenciosa si no hay coords o falla el fetch.

```javascript
async function getWeather(lat, lng, dateStr) {
  const url = `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${lat}&longitude=${lng}` +
    `&daily=temperature_2m_max,precipitation_sum,wind_speed_10m_max` +
    `&timezone=America/Bogota&start_date=${dateStr}&end_date=${dateStr}`;
  const d = await fetch(url).then(r => r.json());
  return d.daily;
}
// Mostrar en modal de ruta: ☀️ 22°C · 🌧 2mm · 💨 12km/h
```

---

#### 4. Export ICS al calendario de iPhone
Al confirmar una ruta, ofrecer "Agregar al calendario" que genera un `.ics` descargable.

```javascript
function exportToCalendar(ruta, fecha) {
  const dt = fecha.replace(/-/g, '');
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\n` +
    `DTSTART:${dt}T060000\n` +
    `SUMMARY:${ruta.nombre} — ${ruta.empresa}\n` +
    `DESCRIPTION:Nivel ${ruta.nivel} · ${ruta.km}km · $${ruta.precio} · ${ruta.punto_encuentro}\n` +
    `DURATION:PT${Math.round(ruta.duracion_h)}H\n` +
    `END:VEVENT\nEND:VCALENDAR`;
  const blob = new Blob([ics], { type: 'text/calendar' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob), download: `ruta_${ruta.id}.ics`
  });
  a.click();
}
```

---

#### 5. Bitácora post-ruta con knee check PFPS
Al marcar una ruta como "hecha", abrir modal de bitácora:

```javascript
const BITACORA_MODAL = {
  kneeCheck: '¿Cómo quedaron las rodillas? 😊 Bien / 😐 Leve / 😣 Dolor',
  nota: 'Nota libre (opcional)',
  dificultad_real: '¿Cómo fue el nivel real? (1-5)',
};
// Guardar en localStorage junto al estado de la ruta
// Vista: pestaña "Bitácora" con historial de rutas hechas + evaluación de rodillas
```

Con el tiempo, esto construye un registro clínico personal: qué rutas de nivel 4 son seguras para Andrés específicamente.

---

#### 6. Slider filtro por km máximo
El filtro actual tiene toggles de nivel pero no de distancia.

```javascript
// Agregar en sección de filtros:
// <input type="range" min="0" max="30" step="1" id="kmMax">
// Label dinámico: "Máx 18 km"
// Filtro: rutas.filter(r => r.km <= kmMax)
```

---

#### 7. Historial visual de rutas hechas
Timeline de todas las rutas marcadas como "hecha" con notas de la bitácora.

```javascript
function renderHistorial() {
  const hechas = Object.entries(DB.estados)
    .filter(([id, e]) => e.estado === 'hecha')
    .sort((a, b) => b[1].fecha - a[1].fecha);
  // Render: tarjeta por ruta con fecha, nombre, nivel, nota, knee check
}
```

---

#### 8. Compartir ruta como imagen
Botón de share que genera tarjeta 1080x1080.

```javascript
function shareRoute(ruta) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  // Fondo #07120d + acento #10B981
  // Nombre en Sora bold grande
  // Empresa, nivel, km, precio
  // Badge "PFPS ⚠️" si nivel >= 4
  navigator.share({ files: [imageFile] });
}
```

---

### 🟢 Baja prioridad

#### 9. Actualización automatizada de programación mensual
En vez de esperar los flyers manualmente, un script que parsea con Claude Vision los screenshots de los flyers de Instagram de ATP / Caminantes 2.0.

```python
# parse_calendar.py
# Input: screenshots de flyers de Instagram (capturar manualmente)
# Claude Vision extrae: nombre_ruta, fecha, nivel, precio, punto_encuentro
# Output: diff de nuevas entradas para data/rutas.json
```

#### 10. Precios actualizados — recordatorio mensual
```powershell
# reminder_precios.ps1 — día 1 de cada mes
Send-DiscordMessage "🏔️ Senderismo: Actualizar precios en rutas.json para el nuevo mes"
```

#### 11. Integración Senderismo ↔ App Gym
Ruta marcada "hecha" en Senderismo → botón "Agregar como sesión de cardio en Gym". Pasaría a App Gym vía `localStorage` compartido o deep link con parámetros.

---

## Rutinas locales nuevas

| Script | Trigger | Acción |
|--------|---------|--------|
| `reminder_precios.ps1` | Día 1 del mes | Discord: actualizar precios en rutas.json |

## Notas técnicas
- Bump `sw.js` cache version tras cualquier cambio
- `file://` no funciona — usar `python -m http.server 8000` para dev local
- `context.md` NO commitear (tiene info personal PFPS/vaults)
