# MEJORAS — Senderismo (Senderismoso)

> PWA de catálogo + calendario de rutas (86 rutas, 4 compañías) con warning PFPS,
> GPX import y sync Gist. Primera caminata hecha 2026-06-07.
> Prompts listos para pegar en Claude Code (Fable 5) desde esta carpeta.

---

## 1. Actualización mensual de catálogo semi-automática

```
Cada mes hay que cargar la programación nueva de 4 compañías desde flyers/PDFs
(julio 2026 está pendiente). Optimiza el flujo:
1. Crea una carpeta inbox/YYYY-MM/ donde Andrés suelta flyers (imagen o PDF).
2. Escribe el prompt-plantilla docs/CARGA_MENSUAL.md para que una sesión de Claude
   lea inbox/, extraiga rutas al schema exacto de data/rutas.json (compañía, nombre,
   fecha, nivel con la escala unificada 1-5, precio, ciudad de partida), detecte
   duplicados vs rutas existentes, y marque con _(por confirmar)_ los campos ilegibles.
3. Script scripts/validate_rutas.py: valida schema, fechas futuras, niveles válidos
   y precios plausibles antes de commitear. Regla: nunca inventar datos que el
   flyer no muestre.
Procesa inbox de julio cuando existan los flyers.
```

## 2. Bitácora post-ruta con knee-check

```
Fase 2 del roadmap: después de una caminata marcada como "hecha", pedir bitácora:
¿cómo respondió la rodilla? (bien/leve/dolor — mismo vocabulario que la app de gym),
duración real, dificultad percibida vs nivel del catálogo, y notas. Guardar en
localStorage + Gist sync. En el catálogo, las rutas de compañía/nivel similares a
una que causó dolor muestran warning reforzado. Mantener single-file PWA y tema
esmeralda.
```

## 3. Checklist pre-ruta + clima

```
Fase 2 restante: al confirmar una ruta, generar checklist pre-ruta (agua por km y
desnivel, bastones OBLIGATORIOS si nivel ≥4 —regla PFPS—, capa por clima de
Open-Meteo del día/lugar, protector, efectivo) con check persistente. Recordatorio
visual la víspera (badge en la card, no push). El clima ya está integrado en el
modal — reusar esa llamada.
```

## 4. Progresión hacia nivel 4

```
La meta es trekking nivel 4 con PFPS. Agrega vista "Progresión": timeline de
caminatas hechas (nivel, km, desnivel de GPX si existe), próximo nivel recomendado
(no saltar >0.5 niveles; repetir nivel si hubo knee-check "leve"), y sugerencia de
2-3 rutas concretas del catálogo que encajan con el siguiente paso. Cruce futuro
con el score B5 de la app de gym (ver App_gym/MEJORAS.md #5) — deja el hook de
datos listo pero sin acoplar.
```
