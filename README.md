# Senderismoso

Planeador de rutas de senderismo en Antioquia. PWA single-file. Catálogo de programaciones mensuales de **A Todo Pulmón** y **Caminantes 2.0 / Explora Antioquia**.

🌐 **App:** https://andresloaiza.github.io/senderismo-oso/

## Features

- 46 rutas Junio 2026 (26 ATP + 20 Caminantes 2.0)
- 3 vistas: Catálogo, Calendario mes, Comparador (hasta 3 rutas)
- Filtros: compañía, nivel (multi-toggle 1–5), días, día de semana, precio máx, búsqueda, estado
- Estados ruta persistentes: ★ Interés / 📅 Planeada / ✓ Confirmada / 🏁 Hecha / ✗ Descartar
- Warning PFPS automático para nivel ≥ 4 (riesgo rodilla)
- Itinerario exportable a portapapeles / share API
- PWA instalable, funciona offline tras primer load

## Stack

- HTML + CSS + JS vanilla, single-file
- `data/rutas.json` — catálogo normalizado
- `sw.js` — service worker cache offline
- `manifest.json` — PWA manifest
- Tema dark + acento lila `#c4a7ff` (consistente con [gym-oso](https://github.com/AndresLoaiza/gym-oso))

## Escala de nivel unificada

| Nivel | Etiqueta | Origen ATP | Origen EA |
|---|---|---|---|
| 1 | Suave | Nivel 1 | — |
| 2 | Bajo | Nivel 2 | BAJO |
| 2.5 | Medio Bajo | — | MEDIO BAJO |
| 3 | Medio | Nivel 3 | MEDIO |
| 3.5 | Medio Alto | Nivel 3.5 | MEDIO ALTO |
| 4 | Alto ⚠ | Nivel 4 | ALTO |
| 5 | Muy Alto ⚠ | — | MUY ALTO |

## Desarrollo local

```bash
python -m http.server 8000
# o
npx http-server -p 8000
```

Abre http://localhost:8000.

## Datos

`data/rutas.json` se regenera al inicio de cada mes con los nuevos flyers de las compañías.

## Compañías

- **A Todo Pulmón** — sin contacto público en flyer
- **Caminantes 2.0** (operado por Explora Antioquia) — WhatsApp +57 302 465 46 55, https://www.exploraantioquia.com, RNT 211609
