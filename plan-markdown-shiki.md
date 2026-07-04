# Plan: Renderizado MarkdownShiki — Análisis y Mejoras

> Fecha: 23 de junio de 2026  
> Proyectos: `spa-loader-content-html-v3` y `curso-jquery-escuelait`

---

## TL;DR

Ambos proyectos comparten el mismo patrón de renderizado pre-compilado con Shiki (`dark-plus`), pero difieren en el plugin SPA que los consume, el volumen de archivos, la versión de Shiki y la riqueza del soporte multi-lenguaje. El plan cubre las diferencias concretas y 8 acciones de mejora priorizadas.

---

## 1. Inventario Actual

### spa-loader-content-html-v3

| Elemento | Valor |
|---|---|
| Plugin SPA | Vanilla JS ES Modules (`spa-loader-content-html`) |
| Versión Shiki | `^3.15.0` |
| Archivos generados | 14 (en `src/markdown-shiki/pages/`) |
| Lenguajes soportados | Solo JS (cjs / esm) |
| Archivos fuente | `src/scripts/js/pages/*.{cjs,esm}.js` |
| Convención de nombres | `{pageName}.{type}-js.html` |
| Backward compat entry | Sí (string → selector derivado por sufijo) |
| Script generación | `pnpm code-highlight` → `node generate-markdown-shiki.js` |
| Copia Gulp | `copyMarkdownShiki` → `src/markdown-shiki/ → app/markdown-shiki/` |
| Inyección en SPA | `fetch(url).then(r => r.text())` + `container.innerHTML = html` |

### curso-jquery-escuelait

| Elemento | Valor |
|---|---|
| Plugin SPA | jQuery (`spa-with-method-load-from-jquery`) |
| Versión Shiki | `^4.1.0` |
| Archivos generados | 47 (clase-17: 38 / clase-18: 9) |
| Lenguajes soportados | HTML, CSS/SCSS, JS, TypeScript |
| Archivos fuente | Dispersos: `src/scripts/`, `src/pages/`, `src/scss/pages/` |
| Convención de nombres | `{clase}/{ejercicio}-{lang}.html` |
| Backward compat entry | No (solo objetos `{ url, target }`) |
| Script generación | `pnpm code-highlight` → `node generate-markdown-shiki.js` |
| Copia Gulp | `copyMarkdownShiki` factory → `src/markdown-shiki/ → app/markdown-shiki/` |
| Inyección en SPA | `fetch(url).then(r => r.text())` + `container.innerHTML = html` |
| Dev | `concurrently` (watch + server en paralelo) |

---

## 2. Diferencias Clave

| # | Aspecto | spa-loader-v3 | curso-jquery |
|---|---|---|---|
| D1 | **Versión Shiki** | `^3.15.0` | `^4.1.0` ← más reciente |
| D2 | **Plugin SPA** | Vanilla JS / ES Modules | jQuery + jQuery UI |
| D3 | **Lenguajes en Shiki** | Solo JS (cjs/esm) | JS + HTML + CSS/SCSS + TS |
| D4 | **Volumen archivos** | 14 archivos | 47 archivos |
| D5 | **Backward compat** | Sí (string entry) | No (solo objetos) |
| D6 | **Fuentes distribuidas** | Un directorio plano | Multi-directorio por tipo |
| D7 | **`generate-markdown-shiki.js`** | Derivación simple (solo -js/-ts) | Derivación multi-sufijo (html/css/js/ts) + multi-ruta |
| D8 | **Dev runner** | `gulp dev` directo | `concurrently` watch + server |
| D9 | **Orden ejecución SPA** | loadComponents → renderShiki → applyMeta | loadComponents → renderShiki → loadLibs → enableDraggables → applyMeta |
| D10 | **Deps innecesarias** | `markdown-it`, `markdown-it-shiki` sin uso real | Ídem |

---

## 3. Acciones de Mejora

### FASE A — Sincronización y limpieza (independientes entre sí)

**A1 — Actualizar Shiki en spa-loader-v3** *(prioridad alta)*  
Elevar `"shiki": "^3.15.0"` → `"^4.1.0"` en `spa-loader-content-html-v3/package.json`.  
Verificar que la API `codeToHtml()` no haya cambiado entre v3 y v4 (en v4 la firma es idéntica).  
Archivo: `spa-loader-content-html-v3/package.json`

**A2 — Mover dependencias CLI a devDependencies** *(prioridad media)*  
`markdown-it`, `markdown-it-shiki` y `shiki` se usan solo en `generate-markdown-shiki.js` (Node, no navegador).  
Deben estar en `devDependencies`, no en `dependencies`, en ambos proyectos.  
Archivos: ambos `package.json`

**A3 — Eliminar backward compat de string entry** *(prioridad baja)*  
En `spa-loader-content-html-v3` la función `renderMarkdownShiki()` soporta entradas como string plano y deriva el selector por sufijo de URL. Esta lógica es frágil.  
Todas las rutas ya usan la forma objeto `{ url, target }`, por lo que el branch de compatibilidad puede eliminarse.  
Archivo: `src/plugins/spa-loader-content-html/v3/spa-loader-content-html.js`

---

### FASE B — Paridad de funcionalidades

**B1 — Añadir soporte multi-lenguaje al generate de spa-loader-v3** *(prioridad media)*  
El `generate-markdown-shiki.js` de spa-loader solo maneja sufijos `-js` y `-ts`. El de curso-jquery soporta además `-html` (→ `src/pages/`) y `-css` (→ `src/scss/pages/`).  
Portar la lógica de derivación multi-sufijo de curso-jquery a spa-loader para homogeneizar.  
Archivo: `spa-loader-content-html-v3/generate-markdown-shiki.js`

**B2 — Paralelizar generación con Promise.all** *(prioridad media)*  
Ambos `generate-markdown-shiki.js` iteran en serie sobre los archivos (`for...of` con `await codeToHtml()`). Cambiar a `Promise.all(htmlPaths.map(...))` reduciría el tiempo de generación significativamente en proyectos grandes (clase-17 tiene 38 archivos).  
Archivos: ambos `generate-markdown-shiki.js`

---

### FASE C — Calidad y consistencia

**C1 — Unificar tipos de MarkdownShikiHtml** *(prioridad baja)*  
En spa-loader-v3, el `@typedef Route` documenta `MarkdownShikiHtml` como `(string | { url: string, target: string })[]`.  
Si se elimina el backward compat (A3), actualizar el typedef a solo `{ url: string, target: string }[]`.  
Archivo: `spa-loader-content-html-v3/types/route.js`

**C2 — Silenciar logs Shiki en producción** *(prioridad baja)*  
En spa-loader-v3, `renderMarkdownShiki()` emite `console.warn('⚠️ No hay archivos Shiki en esta ruta.')` cuando la ruta no tiene MarkdownShikiHtml. Cambiar a retorno silencioso (`return`), ya que es un caso válido (la mayoría de rutas no tienen código que mostrar).  
Archivo: `src/plugins/spa-loader-content-html/v3/spa-loader-content-html.js`

**C3 — Documentar flujo completo en README** *(prioridad baja)*  
Ninguno de los dos proyectos documenta el flujo completo de 4 pasos (generación → copia Gulp → servidor → inyección SPA). Añadir sección "MarkdownShiki" en el README de cada proyecto.

---

## 4. Archivos Afectados

| Acción | Proyecto | Archivo |
|---|---|---|
| A1 | spa-loader-v3 | `package.json` |
| A2 | Ambos | `package.json` |
| A3 | spa-loader-v3 | `src/plugins/spa-loader-content-html/v3/spa-loader-content-html.js` |
| B1 | spa-loader-v3 | `generate-markdown-shiki.js` |
| B2 | Ambos | `generate-markdown-shiki.js` |
| C1 | spa-loader-v3 | `types/route.js` |
| C2 | spa-loader-v3 | `src/plugins/spa-loader-content-html/v3/spa-loader-content-html.js` |
| C3 | Ambos | `README.md` (crear si no existe) |

---

## 5. Verificación por Acción

| Acción | Verificación |
|---|---|
| A1 | `pnpm install` + `pnpm code-highlight` → sin errores, HTML generado idéntico |
| A2 | `pnpm install --prod` no instala shiki/markdown-it |
| A3 | Navegar todas las rutas con MarkdownShikiHtml → código renderizado correctamente |
| B1 | Crear un archivo `src/scripts/js/pages/test-html.html` y `src/pages/test.html`, correr `pnpm code-highlight` → genera HTML con tema `dark-plus` |
| B2 | Medir tiempo de `pnpm code-highlight` antes y después en curso-jquery (47 archivos) |
| C1 | `jsconfig` / IntelliSense no muestra `string` como tipo válido para entries |
| C2 | Navegar ruta sin MarkdownShikiHtml → sin warnings en consola |

---

## 6. Decisiones y Alcance

- **Incluido**: Mejoras al pipeline de generación y al runtime de inyección.
- **Excluido**: Cambios al tema Shiki (ambos usan `dark-plus`, es correcto y consistente).
- **Excluido**: Migración del plugin jQuery a vanilla JS (cambio de mayor envergadura).
- **Excluido**: Añadir nuevas clases/lecciones con MarkdownShiki (contenido, no infraestructura).
