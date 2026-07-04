# spa-loader-content-html v3.1 — Documentación exhaustiva

> Plugin SPA de carga dinámica de contenido HTML con **lazy loading por manifest**,
> **View Transitions API** (sin `TimeoutError`) y **precarga + mutación síncrona** en 3 fases.

- **Archivo:** `src/plugins/spa-loader-content-html/v3.1/spa-loader-content-html.js`
- **Versión:** 3.1
- **Autor:** Antonio Francisco Cutillas García
- **Export:** `spaLoaderContentHtml(options)`
- **Tipo de módulo:** ESM (`export const`)

---

## Tabla de contenidos

1. [Resumen](#1-resumen)
2. [Ubicación y cableado](#2-ubicación-y-cableado)
3. [Modelo de datos](#3-modelo-de-datos)
4. [Estado interno](#4-estado-interno)
5. [Flujo principal: las 3 fases con View Transition](#5-flujo-principal-las-3-fases-con-view-transition)
6. [Referencia de funciones](#6-referencia-de-funciones)
7. [Eventos emitidos](#7-eventos-emitidos)
8. [Estructura del DOM esperada](#8-estructura-del-dom-esperada)
9. [Ejemplo de definición de ruta](#9-ejemplo-de-definición-de-ruta)
10. [Ciclo de vida de una navegación](#10-ciclo-de-vida-de-una-navegación)
11. [Estrategia de errores](#11-estrategia-de-errores)
12. [Por qué la View Transition no lanza TimeoutError](#12-por-qué-la-view-transition-no-lanza-timeouterror)
13. [Guard de navegación y AbortController](#13-guard-de-navegación-y-abortcontroller)
14. [Casos límite y limitaciones conocidas](#14-casos-límite-y-limitaciones-conocidas)
15. [Cambios respecto a v3](#15-cambios-respecto-a-v3)

---

## 1. Resumen

`spaLoaderContentHtml` convierte un sitio multi-página estático en una **SPA** sin
framework. Cada "página" se describe en un objeto `Route` (definido en
`src/routes/route-*.js`) y se carga **bajo demanda** mediante `import()` dinámico
+ `fetch()`.

Características clave de **v3.1**:

- **Lazy loading por manifest:** los módulos de ruta solo se importan cuando se
  navega a ellos, y se cachean (`routeCache`).
- **View Transitions API** para animar el cambio de vista. Se evita el
  `TimeoutError` de Chrome separando la carga de red (async) de la mutación del
  DOM (síncrona) — ver [§5](#5-flujo-principal-las-3-fases-con-view-transition).
- **3 niveles de contenido anidado**, inyectados en orden de dependencia:
  1. componentes del layout (`route.components`)
  2. page components (`route.pagesComponents`) — viven dentro de (1)
  3. bloques Markdown Shiki (`route.MarkdownShikiHtml`) — viven dentro de (2)
- **Guard de navegación** con `AbortController` para cancelar cargas previas ante
  clics rápidos (evita race conditions).
- **Histórico SPA** con `history.pushState` / `popstate` y normalización de rutas
  con `base`.
- **Scripts dinámicos** (clásicos y módulos ES), **estilos**, **favicon** con
  cache-busting y **título** por ruta.
- **Ruta 404** automática desde el manifest.

---

## 2. Ubicación y cableado

```
spa-loader-content-html-v3/
├─ src/
│  ├─ main.js                                    → effectLoadingPage() + spa()
│  ├─ spa/spa.js                                 → invoca spaLoaderContentHtml(configOptionsSpa)
│  ├─ routes/
│  │   ├─ route-manifest.js                      → array de entradas {id, path, file}
│  │   ├─ route-*.js                             → cada módulo exporta un objeto Route
│  │   └─ paths.js                               → constantes de URLs reutilizables
│  └─ plugins/spa-loader-content-html/
│      ├─ v3/spa-loader-content-html.js          → versión anterior (referencia, sin usar)
│      └─ v3.1/spa-loader-content-html.js        → **versión actual en uso**
└─ types/
    ├─ index.js                                  → barril de typedefs JSDoc
    ├─ config-options-spa.js                     → ConfigOptionsSPA
    ├─ route.js                                  → Route, RouteComponents, RouteScript, ...
    └─ route-manifest.js                         → RouteManifest
```

El punto de entrada `src/main.js` llama a `spa()` (en `src/spa/spa.js`), que
construye `configOptionsSpa` e invoca al plugin:

```js
// src/spa/spa.js
import { spaLoaderContentHtml } from "../plugins/spa-loader-content-html/v3.1/spa-loader-content-html.js";

const base = '/mis-plugins-spa/spa-loader-content-html-v3';

const configOptionsSpa = {
    routeManifest,                 // importado de routes/route-manifest.js
    routeModulesBase: `${base}/app/routes`,
    base,
};

spaLoaderContentHtml(configOptionsSpa);
```

> **Nota:** `spa.js` importa de `v3.1/` (no de `v3/`). La carpeta `v3/` se
> conserva únicamente como referencia/historial.

---

## 3. Modelo de datos

### 3.1 `ConfigOptionsSPA` — opciones del plugin

Definido en `types/config-options-spa.js`.

| Propiedad          | Tipo              | Descripción                                                                 |
|--------------------|-------------------|-----------------------------------------------------------------------------|
| `routeManifest`    | `RouteManifest[]` | Manifiesto ligero de rutas para lazy loading.                              |
| `routeModulesBase` | `string`          | Ruta base para `import()` dinámico de los módulos de ruta.                 |
| `base`             | `string`          | Ruta base de la app (vacía si no se usa `pushState`/hash). Se usa en `normalize`, `buildPathname` y reescritura de URLs. |

### 3.2 `RouteManifest` — entrada del manifest

Cada entrada del array `routeManifest` tiene:

| Propiedad | Tipo     | Descripción                                                       |
|-----------|----------|-------------------------------------------------------------------|
| `id`      | `string` | Identificador de la ruta (ej. `'htmlPage'`).                      |
| `path`    | `string` | URL interna asociada (ej. `'html-page'`).                         |
| `file`    | `string` | Nombre del módulo de ruta sin extensión (ej. `'route-html-page'`).|

### 3.3 `Route` — configuración completa de una vista

Definido en `types/route.js`. Exportado por cada `route-*.js`.

| Propiedad           | Tipo                      | Req. | Descripción                                                                 |
|----------------------|---------------------------|------|-----------------------------------------------------------------------------|
| `id`                 | `string`                  | sí   | Identificador único.                                                        |
| `path`               | `string`                  | sí   | URL interna.                                                                |
| `pageTitle`          | `string`                  | —    | Texto para `<title>`.                                                       |
| `headerTitle`        | `string`                  | —    | Título inyectado en `#layoutHeader #headerTitle` y `#layoutFooter #footerTitle`. |
| `favicon`            | `string`                  | —    | Ruta del favicon de la vista.                                               |
| `components`         | `RouteComponents`         | —    | Mapa `idContenedor → urlHTML` que puebla regiones del layout.               |
| `pagesComponents`    | `PageComponentEntry[]`    | —    | Componentes HTML inyectados dentro de la vista (selectores CSS arbitrarios).|
| `MarkdownShikiHtml`  | `MarkdownShikiEntry[]`    | —    | HTML ya resaltado por Shiki, inyectado en contenedores `[data-shiki="..."]`.|
| `styles`             | `RouteStyle[] \| null`    | —    | Hojas CSS de la vista.                                                      |
| `scripts`            | `RouteScript[] \| null`   | —    | Scripts a cargar dinámicamente.                                             |

**`RouteComponents`** = `Record<string, string|undefined>` — clave = id del
contenedor del DOM (sin `#`), valor = URL del HTML (o `undefined` para ocultar).

**`PageComponentEntry`** = `{ url: string, target: string }` — `target` es un
selector CSS (ej. `'[data-component-page="htmlPage"]'`).

**`MarkdownShikiEntry`** = `{ url: string, target: string }` — `target` es un
selector CSS (ej. `'[data-shiki="codeCss"]'`).

**`RouteStyle`** = `{ href: string }`.

**`RouteScript`** = `{ src: string, isModule?: boolean, exportFunctionName?: string|null }`.

---

## 4. Estado interno

El plugin es una **fábrica** (`spaLoaderContentHtml(options)` devuelve nada, pero
ejecuta `init()` al final). Todo su estado vive en el closure de esa función:

| Variable                 | Tipo                      | Propósito                                                                                  |
|--------------------------|---------------------------|--------------------------------------------------------------------------------------------|
| `browserWindow`          | `Window & { __spaFirstRouteLoaded? }` | Ref. a `window` con flag de primera ruta cargada.                                |
| `isPopNavigation`        | `boolean`                 | `true` cuando la navegación viene de `popstate` (atrás/adelante). Evita `pushState` duplicado. |
| `isNavigating`           | `boolean`                 | `true` mientras hay una carga en curso (guard contra race conditions).                     |
| `activeNavigationAbort`  | `AbortController \| null` | Controller activo para abortar fetchs de la navegación en curso al iniciar una nueva.       |
| `settings`               | `ConfigOptionsSPA`        | Configuración mezclada con defaults: `{ routeManifest:[], routeModulesBase:'', base:'' }`.  |
| `routeCache`             | `Map<string, Route>`      | Cache de módulos de ruta ya importados (`file → Route`).                                   |
| `brokenRouteModules`     | `Set<string>`             | Registro de módulos cuyo `import()` falló, para **no reintentar**.                         |
| `_faviconSessionKey`     | `number`                  | `Date.now()` fijo por sesión para cache-busting del favicon (evita parpadeo en back-nav).  |

---

## 5. Flujo principal: las 3 fases con View Transition

El corazón de v3.1 es `loadContent(route)`. En vez de hacer `fetch` dentro del
callback de `document.startViewTransition` (lo que provoca el `TimeoutError` de
Chrome por su timeout interno cuando hay I/O asíncrono), **separa** la carga de
red de la mutación del DOM en **3 fases**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FASE 1 — PRECARGA (async, FUERA de la View Transition)                 │
│  preloadRouteContent(route, signal)                                     │
│    • fetch() de todos los HTML: components, pagesComponents, Shiki      │
│    • NO toca el DOM. Devuelve un payload con el HTML listo (strings)    │
│    • Para pagesComponents/Shiki guarda el SELECTOR (string), no el      │
│      elemento, porque sus contenedores aún no existen en el DOM.        │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  FASE 2 — MUTACIÓN (SÍNCRONA, DENTRO de document.startViewTransition)   │
│  applyPreloadedContent(payload, route)                                  │
│    • Callback síncrono → Chrome no hace timeout → animación fluida.     │
│    • Inyecta en ORDEN DE DEPENDENCIA (contenedores anidados):           │
│        (1) components     → layoutHeader/Navbar/Main/Footer             │
│        (2) pagesComponents → ahora [data-component-page="..."] existe   │
│        (3) Markdown Shiki  → ahora [data-shiki="..."] existe            │
│    • actionsNavbar(), metadatos síncronos (applyRouteMetaSync).         │
│    • Si NO hay soporte de VT, se ejecuta directamente (mismo resultado).│
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  FASE 3 — SCRIPTS (async, DESPUÉS de la View Transition)                │
│  applyRouteMetaAsync(route)                                             │
│    • Carga los scripts de route.scripts secuencialmente.                │
│    • Necesitan el DOM ya mutado (contenedores inyectados) para funcionar│
│    • notifyRouteLoaded(route) → emite spa:route-loaded.                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Por qué el orden (1)→(2)→(3) es crítico

Los contenedores destino de cada nivel **viven dentro** del HTML del nivel
anterior:

- `[data-component-page="htmlPage"]` está **dentro** del HTML inyectado en
  `layoutMain`.
- `[data-shiki="codeHtml"]` está **dentro** del HTML de los pageComponents.

Si se resolvieran los selectores antes de inyectar el nivel padre, devolverían
`null`. Por eso la FASE 1 solo hace `fetch` (guarda selectores como string) y la
FASE 2 resuelve los contenedores del DOM **live** tras cada inyección.

---

## 6. Referencia de funciones

### 6.1 Punto de entrada

#### `spaLoaderContentHtml(options = {})`
Fábrica del plugin. Mezcla `options` con defaults en `settings`, crea el cache
`routeCache` y `brokenRouteModules`, y al final **ejecuta `init()`**. No devuelve
nada (el plugin se auto-inicia).

### 6.2 Inicialización e historial

#### `init()` — `async`
1. Log de carga.
2. `setupEventListeners()` (se registra **antes** de la carga inicial para
   capturar clics durante la carga).
3. `findManifestEntryByPath(window.location.pathname)` para la URL actual.
4. Si hay entrada: `await loadRouteModule(entry.file)` → `loadContent(route)` o
   `loadNotFoundRoute('init')`, y `history.replaceState` con el pathname
   normalizado (evita duplicar el historial en la carga inicial).
5. Si no hay entrada: `loadNotFoundRoute('init')` + `replaceState`.

#### `normalize(raw = '')` → `string`
Quita `settings.base` del inicio y los slashes leading/trailing. Usado para
comparar rutas del manifest de forma consistente.

#### `buildPathname(routePath = '')` → `string`
Construye un pathname absoluto normalizado con `base` para `pushState`/
`replaceState`. Usa `new URL(..., location.origin).pathname` con fallback regex
si falla (caracteres especiales).

### 6.3 Manifest y lazy loading

#### `findManifestEntryByPath(rawPathname = '')` → `RouteManifest | undefined`
Busca entrada del manifest comparando `normalize(entry.path)` con
`normalize(rawPathname)`.

#### `findManifestEntryById(id)` → `RouteManifest | undefined`
Busca entrada por `id`.

#### `findNotFoundRoute()` → `RouteManifest | undefined`
Detecta la entrada 404 por `id === '404NotFoundPage'`, `path === '404'` /
`'404-not-found'`, o regex `/404/i` sobre el id.

#### `loadRouteModule(file)` — `async` → `Promise<Route | undefined>`
- Si `routeCache.has(file)` → devuelve cacheado.
- Si `brokenRouteModules.has(file)` → **no reintenta**, devuelve `undefined`
  (mejora D: evita loops de error sobre rutas rotas).
- Si no: `import(`${routeModulesBase}/${file}.js`)`, toma el primer export
  (`Object.values(mod)[0]`), lo cachea y lo devuelve.
- En catch: registra el módulo en `brokenRouteModules` y devuelve `undefined`.

#### `loadNotFoundRoute(source)` — `async`
Resuelve la entrada 404 con `findNotFoundRoute()`. Si no existe, notifica error.
Si existe, `await loadRouteModule(entry404.file)` → `loadContent(route)` o
`notifyRouteLoadError`.

### 6.4 Carga de contenido (las 3 fases)

#### `loadContent(route)` — `async`
Orquesta las 3 fases (ver [§5](#5-flujo-principal-las-3-fases-con-view-transition)).
Gestiona el **guard de navegación** (aborta la navegación previa si hay una en
curso) y el `AbortController`. En `finally` libera `isNavigating` y
`activeNavigationAbort`. Captura `AbortError` sin notificar (cancelación
intencional) y el resto de errores vía `notifyRouteLoadError`.

#### `fetchHtmlContent(url, signal)` — `async` → `Promise<string>`
**FASE 1 (helper).** Hace `fetch(url, { signal })`, valida `res.ok` (lanza
`HTTP <status> <statusText>`), lee `res.text()` y aplica
`rewriteInjectedHtmlUrls`. **No toca el DOM**: devuelve el HTML ya reescrito
(string). En error devuelve un HTML con mensaje preciso (HTTP vs red); los
`AbortError` se **propagan** para cancelar toda la carga.

#### `preloadRouteContent(route, signal)` — `async` → `payload`
**FASE 1.** Devuelve un objeto:

```ts
{
  components: Array<{el: HTMLElement, html: string} | {el: HTMLElement, hide: true}>,
  hasComponents: boolean,
  pageComponents: Array<{target: string, html: string}>,   // selector como string
  markdownShiki:  Array<{target: string, html: string}>,   // selector como string
}
```

- **`components`:** resuelve el elemento real (`document.getElementById`) porque
  los contenedores del layout **ya existen** en el DOM. Si `url` es falsy →
  `{el, hide: true}` (sin fetch).
- **`pageComponents`:** solo hace `fetch` y guarda `target` como string (el
  contenedor aún no existe).
- **`markdownShiki`:** solo hace `fetch` y guarda `target` como string.

#### `applyPreloadedContent(payload, route)` → `void`
**FASE 2.** Síncrona. Inyecta en orden de dependencia:
1. `components` → `el.innerHTML = html` (+ `display`).
2. `actionsNavbar()` (protegido con try/catch).
3. `pageComponents` → resuelve `resolveContainer(target)` del DOM live (ahora
   existe) → `container.innerHTML = html`.
4. `markdownShiki` → resuelve `resolveContainer(target)` (ahora existe) →
   `container.innerHTML = html`.
5. `applyRouteMetaSync(route)`.

`resolveContainer(target)` acepta selector CSS completo (`[`, `.`, `#`) o id sin
`#` (retrocompatibilidad).

#### `applyRouteMetaSync(route)` → `void`
Metadatos **síncronos**, ejecutados dentro de la FASE 2:
- `document.title = route.pageTitle`
- `updateFavicon(route.favicon)`
- `history.pushState` (si no es popstate y el pathname cambió) con `{id, path, routeFile, favicon}`.
- `isPopNavigation = false`
- `addTitleHeaderFooter(route.headerTitle)`
- `loadStylesheetsByPage(route.styles)`

> No incluye Markdown Shiki (inyectado en FASE 2) ni scripts (FASE 3).

#### `applyRouteMetaAsync(route)` — `async`
**FASE 3.** Carga `route.scripts` secuencialmente con `loadScripts` (respeta
dependencias entre scripts).

### 6.5 Notificaciones

#### `notifyRouteLoaded(route)` → `void`
Emite `spa:route-loaded` con `{id, path}`. La **primera vez** marca
`browserWindow.__spaFirstRouteLoaded = true` y emite `spa:first-route-loaded`
(desbloquea el loader inicial).

#### `notifyRouteLoadError(route, error, source)` → `void`
Emite `spa:route-load-error` con `{id, path, source, message}`. Si es la primera
carga, también emite `spa:first-route-loaded` para desbloquear el loader con
fallback.

### 6.6 Metadatos

#### `updateFavicon(favicon)` → `void`
Cache-busting por sesión (`_faviconSessionKey`). Si ya existe un `link[rel~="icon"]`
con el mismo archivo (comparado sin querystring), **no hace nada** (evita
parpadeo). Si es distinto, actualiza el `href` in-place y elimina duplicados. Si
no existe, crea el `<link>`.

#### `addTitleHeaderFooter(title)` → `void`
Inyecta `title` en `#layoutHeader #headerTitle` y `#layoutFooter #footerTitle`
(si existen).

#### `loadStylesheetsByPage(styles)` → `void`
Elimina los `link[data-page-style="true"]` previos y añade los nuevos con
cache-busting (`?t=Date.now()`).

### 6.7 Scripts

#### `isScriptLoaded(src)` → `boolean`
Comprueba si un script ya está en `document.scripts` (comparando sin querystring).

#### `loadScripts({ src, isModule, exportFunctionName })` — `async`
- Si `isModule`: `import(src?v=...)` y, si `exportFunctionName` es una función
  exportada, la ejecuta.
- Si no: crea un `<script async>` con `onload`/`onerror` (resuelve en ambos casos
  para no romper el flujo).
- Cache-busting con `?v=Date.now()`. Evita duplicados con `isScriptLoaded`.

### 6.8 Reescritura de URLs en HTML inyectado

#### `resolveInjectedAssetUrl(value, baseUrl)` → `string`
Normaliza `src`/`href`/`poster`/`srcset` dentro del HTML inyectado:
- Ignora anchors, data/blob/mailto/tel/javascript y URLs con protocolo (`//`).
- Rutas absolutas (`/...`): prefija `settings.base` si no la tienen ya.
- Rutas relativas: resuelve contra `baseUrl` con `new URL`.

#### `rewriteInjectedHtmlUrls(html, sourceUrl)` → `string`
Parsea el HTML con `<template>`, itera `[src],[href],[poster],[srcset]` y aplica
`resolveInjectedAssetUrl` a cada atributo (incluido cada URL dentro de `srcset`).
Devuelve el HTML reescrito.

### 6.9 Navbar móvil y animaciones

#### `actionsNavbar()` → `void`
Configura el menú móvil (`.navbar__container`, `.navbar__btn-open`,
`.navbar__btn-close`). Lanza errores si faltan elementos (capturados en
`applyPreloadedContent`). Estrategia anti-duplicados: **clona** los botones con
`cloneNode(true)` y los reemplaza (elimina listeners previos). Bloquea el scroll
del `body` al abrir (`lockBodyScroll`/`unlockBodyScroll`). Cierra al clic fuera
(listener en `document` con guard `body.dataset._spaClickBound`).

#### `slideDown(element, duration = 300)` / `slideUp(element, duration = 300)` / `slideToggle(element, duration = 300)`
Animaciones manuales basadas en `margin-top` + `transition` + `requestAnimationFrame`
+ reflow forzado (`element.offsetHeight`). `slideDown` usa `cubic-bezier(0.22,1,0.36,1)`,
`slideUp` usa `cubic-bezier(0.4,0,1,1)`. Limpian estilos de transición al terminar.

### 6.10 Navegación (eventos)

#### `setupEventListeners()` → `void`
- **Clic en enlaces internos:** detecta `a[data-id]` (con `closest`). Si tiene
  `data-route` → `loadRouteModule(routeFile)` directo; si solo tiene `data-id` →
  busca en el manifest por id. En ambos casos → `loadContent(route)` o
  `loadNotFoundRoute('click')`. Hace `preventDefault()`.
- **`popstate`:** marca `isPopNavigation = true`, actualiza el favicon
  inmediatamente desde `e.state.favicon` (evita parpadeo durante el async), y usa
  `e.state.routeFile` (rápido, cache) o `findManifestEntryByPath(raw)` como
  fallback → `loadContent` o `loadNotFoundRoute('popstate')`.

---

## 7. Eventos emitidos

Todos se dispatchan en `document`:

| Evento                    | Cuándo                                         | `detail`                                                          |
|---------------------------|------------------------------------------------|-------------------------------------------------------------------|
| `spa:route-loaded`        | Al terminar de renderizar una ruta (FASE 3).   | `{ id, path }`                                                    |
| `spa:first-route-loaded`  | Una sola vez, en la primera ruta cargada.      | —                                                                 |
| `spa:route-load-error`    | Error durante la carga.                        | `{ id, path, source, message }` (`source`: `init`/`click`/`popstate`/`loadContent`) |

El **loader inicial** (`effectLoadingPage`) escucha `spa:first-route-loaded`
(éxito o error) para desbloquearse.

---

## 8. Estructura del DOM esperada

El layout debe existir en el HTML base (`index.html`) con estos ids (usados por
`route.components` y `addTitleHeaderFooter`):

```html
<header id="layoutHeader">  … <span id="headerTitle"></span> … </header>
<nav    id="layoutNavbar">  … .navbar__container .navbar__btn-open .navbar__btn-close … </nav>
<main   id="layoutMain"></main>
<footer id="layoutFooter">  … <span id="footerTitle"></span> … </footer>
```

Dentro del HTML inyectado en `layoutMain` vivirá el contenedor de los
pageComponents:

```html
<!-- dentro de pages/html/html-page.html -->
<div data-component-page="htmlPage">
  … y aquí dentro los contenedores Shiki:
  <div data-shiki="codeHtml"></div>
  <div data-shiki="codeCss"></div>
  …
</div>
```

---

## 9. Ejemplo de definición de ruta

```js
// src/routes/route-html-page.js
import { paths } from './paths.js';
const { favicon, layoutHeader, layoutNavbar, pages, pagesComponents,
        MarkdownShikiHtml, layoutFooter, styles, scripts } = paths;

export const routeHtmlPage = {
    id: 'htmlPage',
    favicon: `${favicon}/html-icon.svg`,
    pageTitle: 'HTML5 — HyperText Markup Language',
    path: 'html-page',
    components: {
        "layoutHeader": `${layoutHeader}`,
        "layoutNavbar": `${layoutNavbar}`,
        "layoutMain":   `${pages}/html/html-page.html`,
        "layoutFooter": `${layoutFooter}`,
    },
    pagesComponents: [
        { url: `${pagesComponents}/html-page.html`, target: '[data-component-page="htmlPage"]' },
    ],
    MarkdownShikiHtml: [
        { url: `${MarkdownShikiHtml}/pages/html-page-html.html`,  target: '[data-shiki="codeHtml"]' },
        { url: `${MarkdownShikiHtml}/pages/html-page-css.html`,   target: '[data-shiki="codeCss"]' },
        { url: `${MarkdownShikiHtml}/pages/html-page-scss.html`,  target: '[data-shiki="codeScss"]' },
        { url: `${MarkdownShikiHtml}/pages/html-page.cjs-js.html`,target: '[data-shiki="codeCjsJs"]' },
        { url: `${MarkdownShikiHtml}/pages/html-page.esm-js.html`,target: '[data-shiki="codeEsmJs"]' },
    ],
    headerTitle: 'HTML5 — HyperText Markup Language',
    styles:  [ { href: `${styles}/html-page.css` } ],
    scripts: [
        { src: `${scripts}/js/pages/html-page.cjs.js` },
        { src: `${scripts}/js/pages/html-page.esm.js`, isModule: true },
    ],
};
```

Y su entrada en el manifest:

```js
// src/routes/route-manifest.js
export const routeManifest = [
    { id: 'htmlPage', path: 'html-page', file: 'route-html-page' },
    // …
    { id: '404NotFoundPage', path: '404', file: 'route-404-not-found-page' },
];
```

Enlaces internos (navegación por clic):

```html
<a data-id="htmlPage" data-route="route-html-page" href="/html-page">HTML</a>
```

---

## 10. Ciclo de vida de una navegación

### Clic en un enlace interno

```
click → setupEventListeners
  → preventDefault
  → loadRouteModule(routeFile)        (cache hit/miss + broken guard)
  → loadContent(route)
       FASE 1: preloadRouteContent     (fetch components + pagesComponents + Shiki)
       FASE 2: startViewTransition(applyPreloadedContent)   (mutación síncrona)
       FASE 3: applyRouteMetaAsync     (scripts)
       → notifyRouteLoaded             (spa:route-loaded)
```

### Navegación con botones del navegador (popstate)

```
popstate → isPopNavigation = true
  → updateFavicon(state.favicon)      (síncrono, evita parpadeo)
  → loadRouteModule(state.routeFile)
  → loadContent(route)
       (mismo flujo de 3 fases; applyRouteMetaSync NO hace pushState porque
        isPopNavigation es true)
```

### Carga inicial

```
init() → setupEventListeners
  → findManifestEntryByPath(location.pathname)
  → loadRouteModule(entry.file)
  → loadContent(route)                (3 fases)
  → history.replaceState(...)         (normaliza el historial inicial)
```

---

## 11. Estrategia de errores

| Situación                         | Comportamiento                                                                 |
|-----------------------------------|--------------------------------------------------------------------------------|
| Módulo de ruta no existe/falla    | `loadRouteModule` lo registra en `brokenRouteModules` y devuelve `undefined` (no reintenta). |
| Ruta no encontrada en manifest    | `loadNotFoundRoute` carga la ruta 404 del manifest.                             |
| No hay ruta 404 configurada       | `notifyRouteLoadError` emite `spa:route-load-error` y desbloquea el loader.    |
| Fetch de HTML falla (HTTP)        | `fetchHtmlContent` devuelve HTML con `HTTP <status>` para inyectar (FASE 2).   |
| Fetch de HTML falla (red)         | `fetchHtmlContent` devuelve HTML con "Error de red" para inyectar.             |
| Fetch abortado por nueva navegación | `AbortError` se propaga y **no** se notifica como error (cancelación intencional). |
| Falta un contenedor del layout    | Se omite con `console.warn` (no rompe el flujo).                                |
| `actionsNavbar` sin navbar        | Se captura el error y se loguea (la vista puede no tener navbar).              |
| Script no carga                   | `loadScripts` resuelve la promesa en `onerror` (no rompe el flujo global).     |
| Markdown Shiki falla              | Se loguea y se continúa (no aborta la ruta).                                   |

La filosofía general es **nunca bloquear el loader**: cualquier error notifica
vía `notifyRouteLoadError` o se degrada con un mensaje en el contenedor.

---

## 12. Por qué la View Transition no lanza TimeoutError

`document.startViewTransition(callback)` exige que `callback` (la mutación del
DOM) sea **rápida**. Si dentro de él hay `fetch()`/`await`, Chrome impone un
timeout interno y lanza `TimeoutError`, abortando la animación.

**Solución de v3.1:** el callback de `startViewTransition` es **síncrono**
(`applyPreloadedContent`). Todo el I/O de red se hace **antes**, en la FASE 1
(`preloadRouteContent`), por lo que la mutación solo hace `innerHTML` (instantáneo).

```js
const mutate = () => applyPreloadedContent(payload, route);   // síncrono

if (document.startViewTransition) {
    const vt = document.startViewTransition(() => mutate());
    await vt.finished.catch(() => {});   // suprime rechazos (ej. nueva navegación)
} else {
    mutate();                            // sin soporte: mutación directa
}
```

`vt.finished.catch(() => {})` absorbe rechazos de la animación (p.ej. si una
navegación nueva la interrumpe) para que no salten como *unhandled rejections*.

> Si el navegador no soporta View Transitions, la FASE 2 se aplica directamente
> (mismo resultado visual, sin animación).

---

## 13. Guard de navegación y AbortController

Ante clics rápidos pueden solaparse dos cargas. v3.1 lo evita:

```js
// en loadContent
if (isNavigating && activeNavigationAbort) {
    activeNavigationAbort.abort();          // aborta la navegación anterior
}
activeNavigationAbort = new AbortController();
const signal = activeNavigationAbort.signal;
isNavigating = true;
```

La `signal` se propaga: `loadContent` → `preloadRouteContent` → `fetchHtmlContent`
(`fetch(url, { signal })`) y a los fetchs de Shiki. Cuando una nueva navegación
aborta la anterior:

- Los `fetch` en curso rechazan con `AbortError`.
- `fetchHtmlContent` **propaga** el `AbortError` (no lo convierte en HTML de error).
- `loadContent` lo captura, lo identifica como cancelación intencional y **no**
  notifica error.

**Limitación:** `import()` dinámico **no** soporta `AbortSignal`, así que el
guard aborta los `fetch` pero no un `import()` de módulo de ruta en curso (este
se cachea igual al terminar y se reutiliza en la nueva navegación).

En `finally`, `loadContent` libera `isNavigating` y `activeNavigationAbort`.

---

## 14. Casos límite y limitaciones conocidas

- **`import()` no abortable:** ver [§13](#13-guard-de-navegación-y-abortcontroller).
- **Rutas con `components` vacío:** se loguea un warn y se procesan igualmente
  `pagesComponents`/`MarkdownShikiHtml`/meta (útil para rutas que solo inyectan
  pageComponents).
- **Componente con `url` undefined:** se oculta su contenedor (`display:none` +
  `innerHTML=''`) sin hacer fetch.
- **Selectores anidados faltantes:** si tras inyectar (1) no aparece el contenedor
  de (2), se omite con `warn` (no se inyecta ese pageComponent); idem para (3).
- **Favicon inicial inexistente:** se crea el `<link>` en el primer `updateFavicon`.
- **`base` no configurada:** las rutas absolutas del HTML inyectado se dejan tal
  cual (sin prefijar).
- **Duplicados de scripts:** `isScriptLoaded` previene recargas (comparando sin
  querystring), pero el cache-busting (`?v=Date.now()`) hace que `src` cambie
  entre recargas; la comparación sin querystring lo cubre.
- **View Transition + reduced motion:** el plugin no desactiva la animación según
  `prefers-reduced-motion`; podría añadirse si se desea.

---

## 15. Cambios respecto a v3

### Cambios core (portados de 02-javascript)
1. **`loadContent` reescrito** a `async/await` (v3 usaba `startViewTransition`
   con el fetch dentro del callback → `TimeoutError`). En v3.1 se restauró la
   View Transition pero con el **esquema de 3 fases** (ver [§5](#5-flujo-principal-las-3-fases-con-view-transition)).
2. **Orden de carga corregido:** `renderPageComponents` **antes** de
   `applyRouteMeta` (los scripts de la ruta pueden referenciar contenedores
   inyectados por los pageComponents). En v3 el orden era inverso y los scripts
   fallaban.
3. **`notifyRouteLoaded`** se dispara al **final absoluto** (en v3, en la rama
   sin components, se disparaba antes de `renderPageComponents`, desbloqueando el
   loader prematuramente).

### Mejoras adicionales (A–D)
- **A.** `init()` y `loadNotFoundRoute` migrados de `.then()/.catch()` a
  `async/await` (consistencia con el resto).
- **B.** Guard de navegación `isNavigating` + `AbortController` (race conditions).
- **C.** Mensaje de error preciso en `fetchHTML` → `fetchHtmlContent`: distingue
  HTTP (`HTTP <status> <statusText>`) de red (`Error de red: no se pudo conectar`).
  Los `AbortError` se ignoran/propagan según convenga.
- **D.** `loadRouteModule` cachea **fallos** en `brokenRouteModules` (`Set`) para
  no reintentar `import()` sobre rutas rotas.

### Mejora E (View Transition restaurada sin TimeoutError)
- **Refactor a 3 fases:** `preloadRouteContent` (fetch, async) +
  `applyPreloadedContent` (mutación síncrona) + `applyRouteMetaAsync` (scripts).
- **`applyRouteMeta` dividida** en `applyRouteMetaSync` (título, favicon,
  pushState, headerTitle, estilos — FASE 2) y `applyRouteMetaAsync` (scripts — FASE 3).
- **Funciones eliminadas** (su lógica se movió a las nuevas): `loadComponentDom`,
  `fetchHTML`, `renderPageComponents`, `renderMarkdownShiki`.
- **`vt.finished.catch(() => {})`** suprime rechazos de la animación.
- **Bug fix de contenedores anidados:** la FASE 1 guarda selectores como string
  (no resuelve contenedores que aún no existen); la FASE 2 resuelve y inyecta en
  orden de dependencia (1)→(2)→(3).

### Cableado
- `src/spa/spa.js` importa de `v3.1/` en vez de `v3/`.

---

*Documento generado para `spa-loader-content-html` v3.1. Para el plan de cambios
detallado, ver `PLAN.md` en la raíz del proyecto.*
