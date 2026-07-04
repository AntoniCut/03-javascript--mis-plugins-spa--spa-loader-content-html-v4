/*
    *  -----------------------------------------------------------------------------------------------------------------  *
    *  -----  /spa-loader-content-html.js  --  /src/plugins/spa-loader-content-html/v4/spa-loader-content-html.js  -----  *
    *  -----------------------------------------------------------------------------------------------------------------  *
*/


/// <reference path="../../../../types/route-manifest.d.js" />
/// <reference path="../../../../types/route-style.d.js" />
/// <reference path="../../../../types/route.d.js" />
/// <reference path="../../../../types/config-options-spa.d.js" />



/**
 * ------------------------------------------------------------ 
 * ----------  `spaLoaderContentHtml(options = {})`  ----------
 * ------------------------------------------------------------
 *
 * - `Plugin para cargar contenido HTML dinámicamente en una SPA`
 *
 * @version 3.1.0
 * @author Antonio Francisco Cutillas García
 * @param {Partial<ConfigOptionsSPA>} [options={}] - Opciones de configuración.
 */

export const spaLoaderContentHtml = (options = {}) => {


    /** @type {Window & { __spaFirstRouteLoaded?: boolean }} - `Referencia al objeto window del navegador` */
    const browserWindow = window;


    /** - `Indica si la navegación es por popstate (atrás/adelante)` */
    let isPopNavigation = false;


    /** - `Indica si hay una carga de ruta en curso, para evitar navegaciones concurrentes (race conditions ante clics rápidos)` */
    let isNavigating = false;


    /** @type {AbortController|null} - `Controller activo para abortar fetchs de la navegación en curso al iniciar una nueva` */
    let activeNavigationAbort = null;


    /**
     * - `Clave de cache-busting ESTABLE durante toda la sesión (se evalúa una sola vez al cargar el plugin).`
     * - `Antes se usaba Date.now() en cada navegación, lo que impedía al navegador cachear scripts y CSS`
     * - `y forzaba a re-descargarlos completos en cada visita a una ruta ya vista (más lento sin motivo).`
     * - `Con una clave fija por sesión, el navegador reutiliza la caché al revisitar rutas; un recarga`
     * - `completa (F5 o live-reload en desarrollo) genera una nueva sesión y, por tanto, recursos frescos.`
     */
    const _sessionAssetKey = Date.now();


    /**
     * - `Contador incremental de importaciones de módulos ESM (clave de re-evaluación por navegación).`
     * - `Los módulos ESM se cachean en el "module registry" del navegador por URL: importar la MISMA URL`
     * - `NO vuelve a ejecutar su código de nivel superior. Al revisitar/retroceder a una ruta, el demo ESM`
     * - `quedaba sin renderizar porque el DOM se reinyecta vacío pero el módulo no se re-ejecuta.`
     * - `Con una clave única por importación forzamos la re-evaluación (re-render) en cada navegación.`
     */
    let _moduleReloadSeq = 0;



    /*
        *  -------------------------------------------------------------------------  *
        *  -----  Configuración por defecto (solo lo estrictamente necesario)  -----  *
        *  -------------------------------------------------------------------------  *
    */

    /**
     * ---------------------------
     * -----  `settings {}`  -----
     * ---------------------------
     * - `Configuración por defecto del plugin`
    * @type {ConfigOptionsSPA}
     */

    const settings = {
        routeManifest: [],
        routeModulesBase: '',
        base: '',
        ...options
    };


    /** @type {Map<string, Route>} - `Cache de módulos de ruta ya importados dinámicamente` */
    const routeCache = new Map();


    /** @type {Set<string>} - `Registro de módulos de ruta cuyo import() falló, para evitar reintentos repetidos sobre rutas rotas` */
    const brokenRouteModules = new Set();



    /*
        *  ---------------------------------------  *
        *  -----  INICIALIZACIÓN DEL PLUGIN  -----  *
        *  ---------------------------------------  *
    */


    /**
     * ----------------------
     * -----  `init()`  -----
     * ----------------------
     * - `Función de inicialización del plugin (con lazy loading de rutas)`
     * @async
     * @returns {Promise<void>} - No devuelve nada, pero inicializa el plugin y configura el estado inicial.
     */

    const init = async () => {

        console.log('\n');
        console.log("%c ✅ Plugin SPA cargado correctamente - spa-loader-content-html.js - Version 3.1", "background:#2ecc71; color:white; padding:4px;");
        
        /*
        console.log("%c Fondo rojo", "background:#e74c3c; color:white; padding:4px;");
        console.log("%c Fondo verde", "background:#2ecc71; color:white; padding:4px;");
        console.log("%c Fondo azul", "background:#3498db; color:white; padding:4px;");
        console.log("%c Fondo amarillo", "background:#f1c40f; color:black; padding:4px;");
        console.log("%c Gris", "background:#7f8c8d; color:white; padding:4px;");
        console.log("%c Negro", "background:#000; color:#0f0; padding:4px;");
        */

        //  -----  Configurar listener para navegación (antes de la carga inicial para capturar clics durante la carga)  -----
        setupEventListeners();

        //  -----  Buscar la entrada del manifest que corresponde a la URL actual  -----
        const entry = findManifestEntryByPath(window.location.pathname);

        //  -----  Si se encuentra una entrada en el manifest, cargar la ruta correspondiente  -----
        if (entry) {

            try {

                //  -----  Importar dinámicamente el módulo de ruta y cargar su contenido  -----
                const route = await loadRouteModule(entry.file);

                if (route)
                    loadContent(route);
                else
                    await loadNotFoundRoute('init');

                /** Pathname inicial normalizado */
                const initialPathname = buildPathname(route?.path || entry.path || '');

                //  -----  Reemplazar el estado del historial con la ruta inicial para evitar duplicados en el historial  -----
                history.replaceState(
                    {
                        id: route?.id || entry.id,
                        path: initialPathname,
                        routeFile: entry.file,
                        favicon: route?.favicon || null
                    },
                    '',
                    initialPathname
                );

            } catch (e) {

                await loadNotFoundRoute('init');
            }

        } else {

            //  -----  Si no hay entrada en el manifest, intentar cargar la ruta 404  -----
            await loadNotFoundRoute('init');

            //  -----  Reemplazar el estado del historial con la ruta inicial para evitar duplicados en el historial  -----
            history.replaceState(
                {
                    id: null,
                    path: window.location.pathname
                },
                '',
                window.location.pathname
            );
        }

    };



    /*
        *  ---------------------------------------------------------  *
        *  -----  Normalización de rutas, pathnames y slashes  -----  *
        *  ---------------------------------------------------------  *
    */


    /**
     * -----------------------------------
     * -----  `normalize(raw = '')`  -----
     * -----------------------------------
      - Normaliza una ruta (quita base y slashes de inicio/fin)
     * @param {string} raw - `Ruta sin normalizar`
     * @returns {string} - `Ruta normalizada`
     */

    const normalize = (raw = '') => {


        /** Ruta base configurada para la SPA. */
        const base = settings.base || '';

        /** Ruta recibida convertida a string para aplicar normalizacion. */
        let path = String(raw || '');

        if (base && path.startsWith(base))
            path = path.slice(base.length);

        //  -----  quitar leading/trailing slash  -----
        path = path.replace(/^\/|\/$/g, '');

        return path;

    }



    /**
     * ---------------------------------------------
     * -----  `buildPathname(routePath = '')`  -----
     * ---------------------------------------------
     * - Construye pathname absoluto para pushState, normalizado con base
     * @param {string} routePath - Ruta de la ruta (path) para construir el pathname
     * @returns {string} - Pathname absoluto normalizado para usar en pushState y comparación de rutas
     */

    const buildPathname = (routePath = '') => {

        /** Ruta base configurada para la SPA. */
        const base = (settings.base || '').replace(/\/$/, '');

        /** Ruta de entrada normalizada con slash inicial para construir pathname. */
        const trimmed = routePath ? `/${String(routePath).replace(/^\/|\/$/g, '')}` : '';

        //  -----  Construir pathname absoluto usando URL para normalizar correctamente,           -----
        //  -----  con fallback básico si falla (por ejemplo, en rutas con caracteres especiales)  -----
        try {
            return new URL(base + trimmed, location.origin).pathname;

        } 
        
        catch (e) {
            return (base + trimmed).replace(/\/\/+/g, '/');
        }

    };



    /*
        *  --------------------------------------------------------  *
        *  -----  Lazy Loading de módulos de ruta (manifest)  -----  *
        *  --------------------------------------------------------  *
    */


    /**
     * ---------------------------------------------------------
     * -----  `findManifestEntryByPath(rawPathname = '')`  -----
     * ---------------------------------------------------------
     * - Busca una entrada en el manifest por pathname normalizado.
     * @param {string} rawPathname - Pathname sin normalizar (por ejemplo, window.location.pathname)
     * @returns {{ 
            * id: string, 
            * path: string, 
            * file: string 
        * }|undefined} - Entrada del manifest o undefined
     */

    const findManifestEntryByPath = (rawPathname = '') => {

        /** Ruta normalizada para comparar con las entradas del manifest. */
        const normalized = normalize(rawPathname);

        return settings.routeManifest?.find(entry => normalize(entry.path) === normalized);

    };



    /**
     * -------------------------------------------
     * -----  `findManifestEntryById(id)`  -----
     * -------------------------------------------
     * - Busca una entrada en el manifest por id.
     * @param {string} id - Identificador de la ruta (ej: 'inferirTipos')
    * @returns {RouteManifest | undefined} - Entrada del manifest o undefined
     */

    const findManifestEntryById = (id) => {

        return settings.routeManifest?.find(entry => entry.id === id);

    };



    /**
     * ----------------------------------------
     * -----  `loadRouteModule(file)`  -----
     * ----------------------------------------
     * @async
     * - Importa dinámicamente un módulo de ruta y lo cachea para futuras navegaciones.
     * @param {string} file - Nombre del archivo de ruta sin extensión (ej: 'route-01-01-inferir-tipos')
    * @returns {Promise<Route|undefined>} - Objeto de ruta importado o undefined si falla
     */

    const loadRouteModule = async (file) => {

        //  -----  Si ya está en cache, devolver directamente sin hacer import  -----
        if (routeCache.has(file))
            return routeCache.get(file);

        //  -----  Si el módulo ya falló anteriormente, no reintentar el import() para evitar ciclos de error repetidos  -----
        if (brokenRouteModules.has(file)) {
            console.warn(`⚠️ Módulo de ruta previamente roto, se omite reimport: ${file}`);
            return undefined;
        }

        try {

            /** - `URL completa del módulo de ruta para import()` */
            const moduleUrl = `${settings.routeModulesBase}/${file}.js`;

            /** @type {Record<string, unknown>} - `Módulo ESM importado` */
            const mod = await import(moduleUrl);

             /** @type {Route|undefined} - `Primer export del módulo` */
            const route = /** @type {Route|undefined} */ (Object.values(mod)[0]);

            //  -----  Cachear para futuras navegaciones  -----
            if (route)
                routeCache.set(file, route);

            console.log(`📦 Ruta cargada dinámicamente: ${file}`);

            return route;

        } catch (e) {
            console.error(`❌ Error importando módulo de ruta: ${file}`, e);

            //  -----  Registrar el módulo como roto para no reintentar import() en futuras navegaciones  -----
            brokenRouteModules.add(file);

            return undefined;
        }

    };



    /**
     * -----------------------------------
     * -----  `findNotFoundRoute()`  -----
     * -----------------------------------
     * - Obtiene la entrada 404 del manifest.
     * @returns {{ 
            * id: string, 
            * path: string, 
            * file: string 
        * }|undefined} - Entrada 404 del manifest o undefined.
     */

    const findNotFoundRoute = () => {

        //  -----  Buscar en el manifest una entrada con id '404NotFoundPage' o path que contenga '404'  -----
        return settings.routeManifest?.find(entry =>

            entry?.id === '404NotFoundPage' ||
            normalize(entry?.path) === '404' ||
            normalize(entry?.path) === '404-not-found' ||
            /404/i.test(String(entry?.id || ''))
        );

    };



    /**
     * -----------------------------------------
     * -----  `loadNotFoundRoute(source)`  -----
     * -----------------------------------------
     * - Carga la ruta 404 dinámicamente desde el manifest.
     * @async
     * @param {'init'|'click'|'popstate'} source - Origen del intento de carga de ruta (para logging y eventos).
     * @returns {Promise<void>} - No devuelve nada, pero carga la ruta 404 o notifica error si no está configurada, evitando bloqueos del loader.
     */

    const loadNotFoundRoute = async (source) => {

        /** Entrada 404 encontrada en el manifest, si existe. */
        const entry404 = findNotFoundRoute();

        //  -----  Si no hay ruta 404 configurada, logueamos error y notificamos para evitar bloqueos del loader  -----
        if (!entry404) {

            console.error(`No existe ruta 404 configurada (source: ${source}).`);

            notifyRouteLoadError(undefined, new Error('No existe ruta 404 configurada.'), source);

            return;
        }

        try {

            //  -----  Importar dinámicamente el módulo de la ruta 404 y cargar su contenido  -----
            const route = await loadRouteModule(entry404.file);

            //  -----  Si se pudo importar la ruta 404, cargar su contenido  -----
            if (route)
                loadContent(route);
            
            //  -----  Si no se pudo importar la ruta 404, logueamos error y notificamos para evitar bloqueos del loader  -----
            else
                notifyRouteLoadError(undefined, new Error('No se pudo importar la ruta 404.'), source);

        } catch (e) {

            notifyRouteLoadError(undefined, new Error('Error importando ruta 404.'), source);
        }

    };



    /*
        *  --------------------------------------------------------------  *
        *  -----  Carga de contenido dinámico, Componentes del DOM  -----  *
        *  -----  y Metadatos de la Ruta (título, favicon, CSS, JS)  ----  *
        *  --------------------------------------------------------------  *
    */


    /**
     * ----------------------------------
     * -----  `loadContent(route)`  -----
     * ----------------------------------
     * - `Función para cargar el contenido de una ruta específica`
     * - Estrategia en 3 fases para soportar View Transitions sin TimeoutError:
     *     1) Precargar TODO el HTML con fetch() FUERA de la transición (async).
     *     2) Mutar el DOM DENTRO de `document.startViewTransition` con un callback SÍNCRONO
     *        (solo innerHTML/estilos), de modo que Chrome no aborta la animación por timeout.
     *     3) Cargar los scripts dinámicos DESPUÉS de la transición (necesitan el DOM ya mutado).
     * - Si el navegador no soporta View Transitions, la mutación se aplica directamente.
     * @param {Route} route - Ruta cuyo contenido se va a cargar.
     * @returns {Promise<void>} - Promesa que se resuelve al terminar la carga; notifica error si falla.
     */

    const loadContent = async (route) => {

        //  -----  Guard de navegación: si ya hay una carga en curso, abortarla para evitar race conditions ante clics rápidos  -----
        if (isNavigating && activeNavigationAbort) {
            activeNavigationAbort.abort();
        }

        //  -----  Crear un nuevo AbortController para esta navegación y marcar como navegando  -----
        activeNavigationAbort = new AbortController();
        const signal = activeNavigationAbort.signal;
        isNavigating = true;

        try {

            //  -----  Validación  -----
            if (!route)
                throw new Error('Ruta inválida');

            //  ============================================================================================
            //  -----  FASE 1: Precargar TODO el contenido asíncrono (fetch) FUERA de la View Transition   -----
            //  -----  Así el callback de startViewTransition será síncrono y Chrome no aborta por timeout   -----
            //  ============================================================================================
            const payload = await preloadRouteContent(route, signal);

            //  ============================================================================================
            //  -----  FASE 2: Mutar el DOM DENTRO de la View Transition (callback síncrono)               -----
            //  -----  Las mutaciones (innerHTML, display, navbar, metadatos síncronos) son instantáneas    -----
            //  ============================================================================================

            /** - `Callback síncrono que aplica todo el contenido precargado de golpe al DOM` */
            const mutate = () => applyPreloadedContent(payload, route);


            //  -----  Si el navegador soporta View Transitions, iniciar la View Transition  ----- 
            //  -----  con el callback síncrono de mutación del DOM                          -----
            if (document.startViewTransition) {

                //  -----  Iniciar la View Transition con el callback síncrono de mutación del DOM  -----
                const viewTransition = document.startViewTransition(() => mutate());

                //  -----  Esperar SOLO a que el DOM quede mutado (updateCallbackDone), NO a que termine la animación (finished).  -----
                //  -----  El DOM ya está listo al inicio de la transición, así que los scripts (FASE 3) pueden empezar a cargar   -----
                //  -----  EN PARALELO con la animación (~300ms), en lugar de esperar a que termine. Capturamos rechazos           -----
                //  -----  (ej. interrupción por nueva navegación) para que no salten como errores no capturados.                  -----
                await viewTransition.updateCallbackDone.catch(() => { });

                //  -----  Dejar que la animación termine en segundo plano sin bloquear la carga de scripts (se ignora su rechazo).  -----
                viewTransition.finished.catch(() => { });

            } else {

                //  -----  Sin soporte de View Transitions: mutar directamente el DOM  -----
                mutate();
            }

            //  ============================================================================================
            //  *-----  FASE 3: Cargar scripts asíncronos con el DOM ya mutado (en paralelo con la animación)  -----
            //  -----  Los scripts necesitan el DOM ya mutado (contenedores inyectados) para funcionar        -----
            //  ============================================================================================
            await applyRouteMetaAsync(route);

            //  -----  Notificar fin de carga de ruta para el loader inicial y listeners externos  -----
            notifyRouteLoaded(route);

        } catch (error) {

            //  -----  Si la carga fue abortada por una nueva navegación, no notificar error: es una cancelación intencional  -----
            if (error instanceof DOMException && error.name === 'AbortError') {
                console.info(`⏭️ Navegación abortada por una nueva navegación: ${route?.id || '(sin id)'}`);
                return;
            }

            //  -----  Notificar error de carga para desbloquear el loader y permitir fallback  -----
            notifyRouteLoadError(route, error, 'loadContent');

        } finally {

            //  -----  Liberar el flag de navegación y el controller al terminar (o ser abortado)  -----
            isNavigating = false;
            activeNavigationAbort = null;
        }

    };



    /**
     * ----------------------------------------
     * -----  `notifyRouteLoaded(route)`  -----
     * ----------------------------------------
     * - Notifica que una ruta SPA terminó de renderizarse.
     * - Emite `spa:route-loaded` en cada navegación.
     * - Emite `spa:first-route-loaded` una sola vez en la primera carga.
    * @param {Route} route - Ruta que se ha cargado, para incluir detalles en los eventos emitidos.
     */

    const notifyRouteLoaded = (route) => {

        //  -----  Notificar carga de ruta para listeners externos (como el loader)  -----
        document.dispatchEvent(

            //  -----  Evento personalizado con detalles de la ruta cargada  -----
            new CustomEvent('spa:route-loaded', {

                //  -----  Detalles de la ruta cargada para que los listeners puedan usar esta información  -----
                detail: {
                    id: route?.id || null,
                    path: route?.path || window.location.pathname
                }
            })
        );


        //  -----  Si esta es la primera ruta cargada, emitimos el evento específico para desbloquear el loader inicial  -----
        if (!browserWindow.__spaFirstRouteLoaded) {

            //  -----  Marcar que la primera ruta ya se cargó para no emitir este evento de nuevo  -----
            browserWindow.__spaFirstRouteLoaded = true;

            //  -----  Emitir evento personalizado indicando que la primera ruta se ha cargado (para que el loader inicial pueda desbloquearse)  -----
            document.dispatchEvent(new CustomEvent('spa:first-route-loaded'));
        }

    };


    /**
     * ----------------------------------------------------------
     * -----  `notifyRouteLoadError(route, error, source)`  -----
     * ----------------------------------------------------------
     * - Notifica un error durante la carga de ruta.
     * - Si ocurre en la carga inicial, desbloquea el loader con un fallback seguro.
     * @param {Route|undefined} route - Ruta que se intentaba cargar cuando ocurrió el error (puede ser undefined si no se pudo determinar).
     * @param {unknown} error - Error ocurrido durante la carga de la ruta, puede ser cualquier tipo (Error, string, etc.).
     * @param {string} source - Fuente del error, por ejemplo 'init' para errores durante la carga inicial.
     */

    const notifyRouteLoadError = (route, error, source) => {

        console.error('❌ Error cargando ruta SPA:', error);

        //  -----  Emitir evento personalizado con detalles del error para que los listeners puedan manejarlo.  -----
        //  -----   (por ejemplo, el loader puede mostrar un mensaje de error o desbloquearse con un fallback)  -----
        document.dispatchEvent(

            //  -----  Evento personalizado con detalles del error ocurrido durante la carga de la ruta  -----
            new CustomEvent('spa:route-load-error', {

                //  -----  Detalles del error para que los listeners puedan usar esta información  -----
                detail: {
                    id: route?.id || null,
                    path: route?.path || window.location.pathname,
                    source,
                    message: error instanceof Error ? error.message : String(error || 'Error desconocido')
                }
            })
        );

        //  -----  Si el error ocurrió durante la carga inicial (source: 'init'), emitimos el evento de primera ruta cargada para desbloquear el loader con un fallback seguro  -----
        if (!browserWindow.__spaFirstRouteLoaded) {

            //  -----  Marcar que la primera ruta ya se cargó para no emitir este evento de nuevo  -----
            browserWindow.__spaFirstRouteLoaded = true;

            //  -----  Emitir evento personalizado indicando que la primera ruta se ha cargado (aunque haya sido con error) para que el loader inicial pueda desbloquearse  -----
            document.dispatchEvent(new CustomEvent('spa:first-route-loaded'));
        }

    };



    /**
     * ---------------------------------------------
     * -----  `fetchHtmlContent(url, signal)`  -----
     * ---------------------------------------------
     * @async
     * - `Descarga HTML por fetch y lo devuelve como string (con URLs reescritas) SIN tocar el DOM.`
     * - `Forma parte de la FASE 1 (precarga) del flujo con View Transition.`
     * - `En caso de error devuelve un HTML con mensaje preciso (HTTP vs red) para inyectar después.`
     * @param {string} url - URL del archivo HTML a descargar.
     * @param {AbortSignal} [signal] - `Señal para abortar el fetch si una nueva navegación lo cancela.`
     * @returns {Promise<string>} - HTML listo para inyectar (reescrito) o HTML de error.
     */
    const fetchHtmlContent = async (url, signal) => {

        //  -----  Intentar cargar el contenido HTML con fetch y devolverlo como string (sin tocar el DOM)  -----
        try {

            /** - `Respuesta del fetch` */
            const res = await fetch(url, { signal });

            //  -----  Si la respuesta no es OK, lanzar error con código HTTP para distinguirlo de errores de red  -----
            if (!res.ok)
                throw new Error(`HTTP ${res.status} ${res.statusText}`);

            /** - `Contenido HTML como texto` */
            const html = await res.text();

            //  -----  Reescribir URLs de recursos en el HTML inyectado para evitar roturas en SPA  -----
            return rewriteInjectedHtmlUrls(html, url);

        } catch (e) {

            //  -----  Si el fetch fue abortado por una nueva navegación, propagar para cancelar toda la carga  -----
            if (e instanceof DOMException && e.name === 'AbortError')
                throw e;

            //  -----  Distinguir error HTTP (respuesta recibida con código de error) de error de red (sin respuesta)  -----
            const isHttpError = e instanceof Error && /^HTTP \d/.test(e.message);

            console.error(`❌ Error al cargar ${url}:`, e);

            //  -----  Devolver HTML de error (mensaje preciso) para inyectar en el contenedor en la fase de mutación  -----
            return isHttpError
                ? `<p>${e.message} — No se pudo cargar el contenido.</p>`
                : `<p>Error de red: no se pudo conectar con ${url}.</p>`;
        }

    };



    /**
     * ---------------------------------------------
     * -----  `preloadRouteContent(route, signal)`  -----
     * ---------------------------------------------
     * @async
     * - `FASE 1 del flujo con View Transition: descarga (fetch) TODO el HTML asíncrono de la ruta`
     * - `SIN tocar el DOM, y devuelve un payload con el contenido listo para inyectar de golpe.`
     * - `Componentes del DOM (route.components), page components (route.pagesComponents) y Markdown Shiki (route.MarkdownShikiHtml).`
     * @param {Route} route - Ruta cuyo contenido se va a precargar.
     * @param {AbortSignal} [signal] - `Señal para abortar los fetchs si una nueva navegación los cancela.`
     * @returns {Promise<{
     *   components: Array<{el: HTMLElement, html: string} | {el: HTMLElement, hide: true}>,
     *   hasComponents: boolean,
     *   pageComponents: Array<{target: string, html: string}>,
     *   markdownShiki: Array<{target: string, html: string}>
     * }>} - Payload con el contenido precargado.
     */
    
    const preloadRouteContent = async (route, signal) => {

        /** 
         * @type {{
         *   components: Array<{el: HTMLElement, html: string} | {el: HTMLElement, hide: true}>,
         *   hasComponents: boolean,
         *   pageComponents: Array<{target: string, html: string}>,
         *   markdownShiki: Array<{target: string, html: string}>
         * }} 
         */
        const payload = {
            components: [],
            hasComponents: !!(route.components && Object.keys(route.components).length > 0),
            pageComponents: [],
            markdownShiki: [],
        };


        //  -----  Precargar componentes del DOM (route.components)  -----
        //  -----  Sus contenedores (layoutHeader, layoutNavbar, layoutMain, layoutFooter) SÍ existen ya en el DOM,  -----
        //  -----  así que se resuelve el elemento real para inyectar en la fase de mutación.                          -----
        //  -----  Los fetch se lanzan EN PARALELO (Promise.all): no hay dependencia entre ellos en la fase de         -----
        //  -----  descarga; el orden de dependencia solo importa al inyectar (applyPreloadedContent).                 -----
        const preloadComponents = async () => {

            if (!payload.hasComponents) {
                console.warn(`La ruta '${route.id}' no contiene 'components'`);
                return;
            }

            /** @type {Promise<void>[]} - `Descargas de componentes principales en curso` */
            const tasks = [];

            for (const [selector, url] of Object.entries(route.components)) {

                /** @type {HTMLElement|null} - `Contenedor (selector se trata como id sin #)` */
                const el = document.getElementById(selector);

                //  -----  Si el contenedor NO existe, avisar y omitir  -----
                if (!el) {
                    console.warn(`⚠️ Contenedor no encontrado para selector: #${selector} — se omite.`);
                    continue;
                }

                //  -----  Si no hay url → marcar para ocultar (sin fetch)  -----
                if (!url) {
                    console.warn(`⏭️ Componente "${selector}" ignorado (url undefined). Se ocultará.`);
                    payload.components.push({ el, hide: true });
                    continue;
                }

                //  -----  Precargar el HTML del componente (fetch + rewrite) sin tocar el DOM, en paralelo  -----
                tasks.push(
                    fetchHtmlContent(url, signal).then((html) => { payload.components.push({ el, html }); })
                );
            }

            await Promise.all(tasks);
        };


        //  -----  Precargar page components (route.pagesComponents)  -----
        //  -----  OJO: sus contenedores destino (p.ej. [data-component-page="htmlPage"]) viven DENTRO  -----
        //  -----  del HTML de los componentes principales, que aún NO se ha inyectado. Por eso aquí solo  -----
        //  -----  hacemos fetch y guardamos el selector como string; el contenedor se resuelve en la      -----
        //  -----  fase de mutación (applyPreloadedContent), tras inyectar los componentes principales.    -----
        const preloadPageComponents = async () => {

            if (!(route.pagesComponents && Array.isArray(route.pagesComponents)))
                return;

            /** @type {Promise<void>[]} - `Descargas de page components en curso` */
            const tasks = [];

            for (const entry of route.pagesComponents) {

                /** @type {string|undefined} - URL del componente de página */
                const url = entry?.url;

                /** @type {string|undefined} - Selector CSS del contenedor destino */
                const target = entry?.target;

                //  -----  Validación de la entrada: debe tener url y target  -----
                if (!url || !target) {
                    console.warn('⚠️ Entrada pagesComponents incompleta (falta url o target). Se omite.');
                    continue;
                }

                //  -----  Precargar el HTML (fetch + rewrite) sin resolver ni tocar el contenedor, en paralelo  -----
                tasks.push(
                    fetchHtmlContent(url, signal).then((html) => { payload.pageComponents.push({ target, html }); })
                );
            }

            await Promise.all(tasks);
        };


        //  -----  Precargar Markdown Shiki (route.MarkdownShikiHtml)  -----
        //  -----  OJO: sus contenedores destino (p.ej. [data-shiki="codeHtml"]) viven DENTRO del HTML  -----
        //  -----  de los page components (o de los componentes principales), que aún NO se ha inyectado.  -----
        //  -----  Aquí solo hacemos fetch y guardamos el selector; se resuelve en la fase de mutación,    -----
        //  -----  tras inyectar componentes principales y page components.                                 -----
        const preloadMarkdownShiki = async () => {

            if (!(route.MarkdownShikiHtml && Array.isArray(route.MarkdownShikiHtml)))
                return;

            /** @type {Promise<void>[]} - `Descargas de archivos Shiki en curso` */
            const tasks = [];

            for (const entry of route.MarkdownShikiHtml) {

                /** @type {string|undefined} - Nombre del archivo .html generado */
                const fileName = entry?.fileName;

                /** @type {string|undefined} - URL (con base) de la carpeta donde se sirve el .html generado */
                const urlOutput = entry?.urlOutput;

                /** @type {string|undefined} - Selector CSS del contenedor destino */
                const target = entry?.target;

                if (!fileName || !urlOutput || !target)
                    continue;

                /** @type {string} - URL final del archivo Shiki a cargar */
                const url = `${urlOutput}/${fileName}`;

                //  -----  Precargar el HTML del archivo Shiki (fetch) sin resolver ni tocar el contenedor, en paralelo  -----
                tasks.push(
                    fetch(url, { signal })
                        .then((r) => r.text())
                        .then((html) => { payload.markdownShiki.push({ target, html }); })
                        .catch((e) => {

                            //  -----  Si fue abortado por nueva navegación, propagar para cancelar la carga  -----
                            if (e instanceof DOMException && e.name === 'AbortError')
                                throw e;

                            console.error(`❌ Error cargando archivo Shiki: ${url}`, e);
                        })
                );
            }

            await Promise.all(tasks);
        };


        //  -----  Ejecutar los tres grupos de precarga EN PARALELO: ninguno depende del otro para descargar.  -----
        //  -----  Se mantiene la carga bajo demanda (solo se pide lo de ESTA ruta), pero sin esperas en serie.  -----
        await Promise.all([
            preloadComponents(),
            preloadPageComponents(),
            preloadMarkdownShiki(),
        ]);


        //  -----  Devolver el payload precargado  -----
        return payload;

    };



    /**
     * -----------------------------------------------------
     * -----  `applyPreloadedContent(payload, route)`  -----
     * -----------------------------------------------------
     * - `FASE 2 del flujo con View Transition: aplica el payload precargado al DOM de forma SÍNCRONA.`
     * - `Diseñada para ejecutarse dentro del callback de document.startViewTransition,`
     * - `por lo que NO realiza ningún fetch ni await: solo innerHTML/estilos/acciones síncronas.`
     * - `Inyecta en ORDEN DE DEPENDENCIA para que los contenedores anidados existan antes de usarse:`
     *     1) Componentes principales (layoutHeader/layoutNavbar/layoutMain/layoutFooter) → sus contenedores ya están en el DOM.
     *     2) Page components (target p.ej. [data-component-page="htmlPage"]) → viven DENTRO del HTML de (1), se resuelven tras inyectar (1).
     *     3) Markdown Shiki (target p.ej. [data-shiki="codeHtml"]) → viven DENTRO del HTML de (2), se resuelven tras inyectar (2).
     * - `Ejecuta también los metadatos síncronos (título, favicon, pushState, headerTitle, estilos).`
     * @param {{ 
         * components: Array<{el: HTMLElement, html: string} | {el: HTMLElement, hide: true}>, 
         * pageComponents: Array<{target: string, html: string}>, 
         * markdownShiki: Array<{target: string, html: string}> 
         * }} payload - Contenido precargado por preloadRouteContent.
     * @param {Route} route - Ruta cuyos metadatos síncronos se aplican.
     * @returns {void}
     */

    const applyPreloadedContent = (payload, route) => {

        /**
         * - `Resuelve un selector a elemento del DOM.`
         * - `Acepta un selector CSS completo (empieza por '[', '.' o '#') o un id sin '#' (retrocompatibilidad).`
         * @param {string} target - Selector CSS o id sin '#'
         * @returns {HTMLElement|null}
         */
        const resolveContainer = (target) =>
            (typeof target === 'string' && /^[.\[#]/.test(target))
                ? document.querySelector(target)
                : document.querySelector(`#${target}`);


        //  -----  (1) Inyectar componentes principales (síncrono)  -----
        //  -----  Sus contenedores son elementos del layout ya presentes en el DOM.  -----
        for (const item of payload.components) {

            
            //  -----  Componente sin url → ocultar contenedor y limpiar  -----
            if ('hide' in item) {
                item.el.style.display = 'none';
                item.el.innerHTML = '';
                continue;
            }

            //  -----  Restaurar visibilidad y volcar el HTML precargado  -----
            item.el.style.display = '';
            item.el.innerHTML = item.html;
        }


        //  -----  Inicializar acciones del navbar (síncrono, protegido si no existe en la vista)  -----
        try {

            actionsNavbar();

        } catch (e) {

            console.warn('⚠️ actionsNavbar falló (probablemente falta .navbar__container en la vista):', e);
        }


        //  -----  (2) Inyectar page components (síncrono)  -----
        //  -----  Ahora los contenedores destino (que vivían dentro del HTML de los componentes) ya existen en el DOM.  -----
        for (const { target, html } of payload.pageComponents) {

            /** @type {HTMLElement|null} - `Contenedor destino resuelto tras inyectar los componentes principales` */
            const container = resolveContainer(target);

            if (!container) {
                console.warn(`⚠️ Contenedor no encontrado para pageComponent: ${target} — se omite.`);
                continue;
            }

            container.style.display = '';
            container.innerHTML = html;
        }


        //  -----  (3) Inyectar Markdown Shiki (síncrono)  -----
        //  -----  Ahora los contenedores [data-shiki="..."] (que vivían dentro del HTML de los page components) ya existen en el DOM.  -----
        for (const { target, html } of payload.markdownShiki) {

            /** @type {HTMLElement|null} - `Contenedor destino resuelto tras inyectar los page components` */
            const container = resolveContainer(target);

            if (!container) {
                console.warn(`⚠️ Contenedor no encontrado para Markdown Shiki: ${target} — se omite.`);
                continue;
            }

            container.innerHTML = html;
        }


        //  -----  Aplicar metadatos síncronos (título, favicon, pushState, headerTitle, estilos)  -----
        applyRouteMetaSync(route);

    };



    /*
        *  ----------------------------------------------------------------------------------------------------  *
        *  -----  Funciones auxiliares para manejo de URLs en HTML inyectado (src, href, poster, srcset)  -----  *
        *  ----------------------------------------------------------------------------------------------------  *
    */


    /**
     * -------------------------------------------------------
     * -----  `resolveInjectedAssetUrl(value, baseUrl)`  -----
     * -------------------------------------------------------
     * - Normaliza rutas de recursos dentro de HTML inyectado.
     * - Soporta rutas relativas al archivo HTML fuente y rutas absolutas prefijadas con settings.base.
     * @param {string} value - Valor del atributo (src, href, poster, etc.)
     * @param {string} baseUrl - URL del archivo HTML inyectado
     * @returns {string}
     */

    const resolveInjectedAssetUrl = (value, baseUrl) => {

        /** - Valor del atributo normalizado */
        const raw = String(value || '').trim();

        //  -----  Ignorar anchors, data URI, protocolos externos y especiales  -----
        if (!raw || /^#|^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(raw) || /^(data|blob|mailto|tel|javascript):/i.test(raw))
            return value;

        //  -----  Si es ruta absoluta desde raíz, prefijar base de la SPA (si aplica)  -----
        if (raw.startsWith('/')) {

            /** - Base de la SPA normalizada */
            const base = (settings.base || '').replace(/\/$/, '');

            //  -----  Si no hay base, devolver la ruta tal cual  -----
            if (!base)
                return raw;

            //  -----  Si la ruta ya empieza con la base, devolver tal cual  -----
            if (raw === base || raw.startsWith(`${base}/`))
                return raw;

            //  -----  Prefijar base de la SPA a la ruta absoluta  -----
            return `${base}${raw}`;

        }


        //  -----  Resolver rutas relativas contra la URL del HTML inyectado  -----
        try {

            /** - Resolver rutas relativas contra la URL del HTML inyectado */
            const resolved = new URL(raw, new URL(baseUrl, window.location.origin));

            return `${resolved.pathname}${resolved.search}${resolved.hash}`;

        } catch (e) {
            return value;
        }

    };



    /**
     * --------------------------------------------------------
     * -----  `rewriteInjectedHtmlUrls(html, sourceUrl)`  -----
     * --------------------------------------------------------
     * - Reescribe URLs de recursos en HTML inyectado para evitar roturas en SPA.
     * @param {string} html - HTML crudo obtenido por fetch.
     * @param {string} sourceUrl - URL del archivo HTML origen.
     * @returns {string} - HTML con URLs reescritas para src, href, poster y srcset.
     */

    const rewriteInjectedHtmlUrls = (html, sourceUrl) => {

        /** - contenedor temporal para manipular el HTML inyectado */
        const template = document.createElement('template');

        //  -----  Asignar el HTML crudo al contenedor temporal  -----
        template.innerHTML = html;

        //  -----  Reescribir URLs de recursos en todos los elementos con src, href, poster o srcset  -----
        template.content.querySelectorAll('[src],[href],[poster],[srcset]').forEach((node) => {

            //  -----  Reescribir src  -----
            if (node.hasAttribute('src')) {
                const src = node.getAttribute('src');
                if (src)
                    node.setAttribute('src', resolveInjectedAssetUrl(src, sourceUrl));
            }

            //  -----  Reescribir href  -----
            if (node.hasAttribute('href')) {
                const href = node.getAttribute('href');
                if (href)
                    node.setAttribute('href', resolveInjectedAssetUrl(href, sourceUrl));
            }

            //  -----  Reescribir poster  -----
            if (node.hasAttribute('poster')) {
                const poster = node.getAttribute('poster');
                if (poster)
                    node.setAttribute('poster', resolveInjectedAssetUrl(poster, sourceUrl));
            }

            //  -----  Reescribir srcset  -----
            if (node.hasAttribute('srcset')) {

                /** - Obtener el atributo srcset */
                const srcset = node.getAttribute('srcset');

                //  -----  Si srcset existe, reescribir cada URL dentro de él  -----
                if (srcset) {

                    /** - Reescribir cada URL en el atributo srcset */
                    const normalized = 
                    
                        srcset
                        
                            .split(',')
                        
                            .map((entry) => {

                                /** - Reescribir cada URL en el atributo srcset */
                                const value = entry.trim();

                                //  -----  Ignorar entradas vacías  -----
                                if (!value)
                                    return value;


                                /** - Separar URL y descriptor */
                                const [srcCandidate, descriptor] = value.split(/\s+/, 2);

                                const resolvedSrc = resolveInjectedAssetUrl(srcCandidate, sourceUrl);

                                return descriptor ? `${resolvedSrc} ${descriptor}` : resolvedSrc;

                            })
                            
                            .join(', ');

                    node.setAttribute('srcset', normalized);
                }
            }
        });

        //  -----  Devolver el HTML reescrito como string  -----
        return template.innerHTML;
    };



    /*
        *  -----------------------------------------------------------------------------  *
        *  -----  Metadatos de la Ruta (título, favicon, CSS, JS)                   ----  *
        *  -----  Ver applyRouteMetaSync (fase de mutación) y applyRouteMetaAsync   ----  *
        *  -----  (fase de scripts, tras la View Transition)                        ----  *
        *  -----------------------------------------------------------------------------  *
    */





    /**
     * ------------------------------------------
     * -----  `applyRouteMetaSync(route)`  -----
     * ------------------------------------------
     * - `Aplica los metadatos SÍNCRONOS de la ruta (título, favicon, pushState, headerTitle, estilos).`
     * - `Pensada para ejecutarse DENTRO del callback síncrono de document.startViewTransition.`
     * - `NO incluye Markdown Shiki (se inyecta en la fase de mutación) ni scripts (carga async, fase 3).`
     * @param {Route} route - Ruta de la cual aplicar los metadatos síncronos en el DOM.
     * @returns {void}
     */

    const applyRouteMetaSync = (route) => {

        //  -----  Actualizar título  -----
        if (route.pageTitle)
            document.title = route.pageTitle;

        //  -----  Actualizar favicon  -----
        if (route.favicon)
            updateFavicon(route.favicon);


        //  -----  pushState seguro (normalizado)  -----

        /**- `Nueva pathname para la ruta` */
        const newPathname = buildPathname(route.path || '');


        //  -----  Evitar push duplicado  -----
        if (!isPopNavigation && window.location.pathname !== newPathname) {

            //  -----  Buscar el archivo de ruta en el manifest para guardarlo en el historial  -----
            const manifestEntry = findManifestEntryById(route.id);

            //  -----  pushState con pathname normalizado, routeFile y favicon para actualización inmediata en popstate  -----
            history.pushState(
                { id: route.id, path: newPathname, routeFile: manifestEntry?.file || null, favicon: route.favicon || null },
                '',
                newPathname
            );
        }

        //  -----  Resetear flag de navegación por popstate después de manejar la ruta  -----
        isPopNavigation = false;

        //  -----  Actualizar headerTitle en layout  -----
        if (route.headerTitle)
            addTitleHeaderFooter(route.headerTitle);

        //  -----  Cargar hoja de estilos CSS  -----
        if (route.styles)
            loadStylesheetsByPage(route.styles);

    };



    /**
     * -------------------------------------------
     * -----  `applyRouteMetaAsync(route)`  -----
     * -------------------------------------------
     * @async
     * - `Carga los scripts dinámicos de la ruta de forma secuencial (FASE 3, después de la View Transition).`
     * - `Los scripts necesitan el DOM ya mutado (contenedores y page components inyectados) para funcionar.`
     * @param {Route} route - Ruta cuyos scripts se van a cargar.
     * @returns {Promise<void>} - Promesa que se resuelve cuando todos los scripts se han cargado.
     */
    const applyRouteMetaAsync = async (route) => {

        //  -----  Cargar scripts dinámicos  -----
        if (route.scripts) {

            //  -----  Cargar cada script de la ruta de forma secuencial para respetar dependencias  -----
            for (const s of route.scripts) {
                await loadScripts(s);
            }
        }

    };



    /**
     * ---------------------------------
     * -----  `faviconSessionKey`  -----
     * ---------------------------------
     * - Clave fija por sesión para el cache-busting del favicon.
     * - Al ser constante dentro de la sesión, el browser puede cachear el archivo de favicon
     *   y servirlo desde caché en navegaciones posteriores (evita parpadeo en back-navigation).
     */
    const _faviconSessionKey = Date.now();


    /**
     * --------------------------------------
     * -----  `updateFavicon(favicon)`  -----
     * --------------------------------------
     * - `Función para actualizar el favicon dinámicamente`
     * @param {string} favicon - URL del nuevo favicon a establecer (puede ser relativa o absoluta)
     * @return {void} - No devuelve nada, pero actualiza el favicon del documento.
     */

    const updateFavicon = (favicon) => {

        /**  - `URL absoluta del nuevo favicon` */
        const newAbsolute = new URL(favicon, document.baseURI).href;

        /** - `URL del nuevo favicon con cache-busting` */
        const newHref = `${favicon}?v=${_faviconSessionKey}`;

        /** @type {HTMLLinkElement|null} - `Referencia al favicon existente` */
        const existing = /** @type {HTMLLinkElement|null} */ (document.querySelector('link[rel~="icon"]'));

        //  -----  Si ya existe un favicon, actualizar su href in-place para evitar parpadeo, y eliminar duplicados si los hubiera  -----
        if (existing) {

            //  -----  Si el archivo es el mismo, no hacer nada para evitar parpadeo  -----
            if (existing.href.split('?')[0] === newAbsolute) 
                return;

            //  -----  Actualizar href in-place evita el instante sin favicon que causa parpadeo  -----
            existing.href = newHref;

            //  -----  Eliminar duplicados si los hubiera  -----
            document.querySelectorAll('link[rel~="icon"]').forEach(link => {
                
                if (link !== existing) 
                    link.remove();

            });

            //  -----  Salir de la función después de actualizar el favicon existente  -----
            return;

        }

        //  -----  No existe ningún favicon: crear el elemento  -----
        
        /** @type {HTMLLinkElement} - `Nuevo elemento favicon` */
        const link = document.createElement('link');
        
        //  -----  Configurar atributos del nuevo favicon  -----
        link.rel = 'icon';
        link.type = 'image/x-icon';
        link.href = newHref;

        //  -----  Agregar el nuevo favicon al head del documento  -----
        document.head.appendChild(link);

    }



    /**
     * -------------------------------------------
     * -----  `addTitleHeaderFooter(title)`  -----
     * -------------------------------------------
     * - Agrega el título al header y footer de la página.
     * @param {string} title - Texto para mostrar en ambos lugares.
     * @returns {void} - No retorna ningún valor.
     */

    const addTitleHeaderFooter = (title) => {

        /** @type {HTMLElement|null} - `Referencia al título del header` */
        const headerTitle = document.querySelector('#layoutHeader #headerTitle');

        //  -----  Si existe el elemento, actualizamos su contenido con el título de la ruta  -----
        if (headerTitle)
            headerTitle.innerHTML = title;

        /** @type {HTMLElement|null} - `Referencia al título del footer` */
        const footerTitle = document.querySelector('#layoutFooter #footerTitle');

        //  -----  Si existe el elemento, actualizamos su contenido con el título de la ruta  -----
        if (footerTitle)
            footerTitle.innerHTML = title;

    }



    /*
        *  ---------------------------------------------------------------------  *
        *  -----  Funciones para manejar acciones del navbar (menú móvil)  -----  *
        *  ---------------------------------------------------------------------  *
    */


    /**
     * -------------------------------
     * -----  `actionsNavbar()`  -----
     * -------------------------------
     * - `Función para manejar las acciones del navbar (abrir/cerrar menú móvil)`
     * -  Animaciones slideUp / slideDown para el menú.
     * @returns {void} - No devuelve nada, pero configura los listeners para el navbar y maneja su estado y animaciones.
     */

    const actionsNavbar = () => {


        /** @type {number} - `Duración de la animación de apertura del menú` */
        const OPEN_DURATION = 560;

        /** @type {number} - `Duración de la animación de cierre del menú` */
        const CLOSE_DURATION = 360;

        /** @type {HTMLElement|null} * - `Referencias a los elementos del navbar` */
        const navbar = document.querySelector('.navbar__container');

        //  -----  Si no se encuentra el navbar, lanzamos un error para que se capture y se loguee en applyPreloadedContent sin romper el flujo global  -----
        if (!navbar)
            throw new Error("❌ No se encontró el elemento .navbar__container");


        /** @type {HTMLElement|null}  - `Referencias a los botones de abrir/cerrar menú` */
        const btnOpen = document.querySelector('.navbar__btn-open');

        //  -----  Si no se encuentra el botón de abrir menú, lanzamos un error para que se capture y se loguee en applyPreloadedContent sin romper el flujo global  -----
        if (!btnOpen)
            throw new Error("❌ No se encontró el elemento .navbar__btn-open");


        /** @type {HTMLElement|null} - `Referencias al botón de cerrar menú` */
        const btnClose = document.querySelector('.navbar__btn-close');

        //  -----  Si no se encuentra el botón de cerrar menú, lanzamos un error para que se capture y se loguee en applyPreloadedContent sin romper el flujo global  -----
        if (!btnClose)
            throw new Error("❌ No se encontró el elemento .navbar__btn-close");


        //  -----  Estado inicial  -----
        navbar.style.display = "none";
        btnClose.style.display = "none";


        /**
         * --------------------------------
         * -----  `lockBodyScroll()`  -----
         * --------------------------------
         * - `Función para bloquear el scroll del body al abrir el menú móvil, evitando que el fondo se mueva mientras el menú está abierto`
         * @returns {void} - No devuelve nada, pero aplica estilos para bloquear el scroll del body.
         */

        const lockBodyScroll = () => {
            document.body.style.overflow = 'hidden';
        };



        /**
         * ----------------------------------
         * -----  `unlockBodyScroll()`  -----
         * ----------------------------------
         * - `Función para desbloquear el scroll del body al cerrar el menú móvil, permitiendo que el fondo vuelva a moverse`
         * @returns {void} - No devuelve nada, pero elimina los estilos que bloquean el scroll del body.
         */

        const unlockBodyScroll = () => {
            document.body.style.removeProperty('overflow');
        };


        //*  -----  Evitar bindings duplicados: clonar botones y reemplazarlos -----

        /** - `Nuevo botón open clonado` */
        const newBtnOpen = /** @type {HTMLElement} */ (btnOpen.cloneNode(true));

        //  -----  Reemplazar el botón original por el nuevo clonado para eliminar listeners anteriores y evitar duplicados  -----
        btnOpen.parentNode?.replaceChild(newBtnOpen, btnOpen);


        /** - `Nuevo botón close clonado` */
        const newBtnClose = /** @type {HTMLElement} */(btnClose.cloneNode(true));

        //  -----  Reemplazar el botón original por el nuevo clonado para eliminar listeners anteriores y evitar duplicados  -----
        btnClose.parentNode?.replaceChild(newBtnClose, btnClose);


        //  -----  Abrir Menú  -----
        newBtnOpen.addEventListener("click", (e) => {

            e.stopPropagation();

            newBtnOpen.style.display = "none";
            newBtnClose.style.display = "flex";

            //  -----  Bloquear scroll del body al abrir el menú para evitar que el fondo se mueva  -----
            lockBodyScroll();

            //  -----  Usar animación slideDown para mostrar el navbar de forma suave  -----
            slideDown(navbar, OPEN_DURATION);

        });


        //  -----  Cerrar Menú  -----
        newBtnClose.addEventListener("click", (e) => {

            e.stopPropagation();

            newBtnClose.style.display = "none";
            newBtnOpen.style.display = "flex";

            //  -----  Usar animación slideUp para ocultar el navbar de forma suave  -----
            slideUp(navbar, CLOSE_DURATION);

            //  -----  Desbloquear scroll del body al cerrar el menú para permitir que el fondo vuelva a moverse  -----
            unlockBodyScroll();

        });


        /*  
            -----  Cerrar menú al hacer clic fuera del navbar  -----
            - eliminamos listener anterior seguro creando uno que no se duplique:
            - añadimos un namespace simple usando dataset
        */
        if (!document.body.dataset._spaClickBound) {

            //  -----  Listener para cerrar el menú al hacer clic fuera del navbar, con protección contra errores por si el navbar no existe en alguna vista  -----
            document.addEventListener("click", () => {

                //  -----  Si el navbar no está visible, no hacemos nada  -----
                try {

                    //  -----  Si el navbar no está visible, no hacemos nada  -----
                    slideUp(navbar, CLOSE_DURATION);

                    newBtnClose.style.display = "none";
                    newBtnOpen.style.display = "flex";

                    //  -----  Desbloquear scroll del body al cerrar el menú para permitir que el fondo vuelva a moverse  -----
                    unlockBodyScroll();

                }

                //  -----  Proteger contra errores si el navbar no existe en alguna vista, para evitar romper el flujo global del plugin  -----
                catch (e) {

                    console.warn('⚠️ No se pudo cerrar el menú al hacer clic fuera (probablemente falta .navbar__container en la vista):', e);
                }

            });


            //  -----  Marcar que el listener de clic para cerrar el menú ya está configurado para evitar duplicados  -----
            document.body.dataset._spaClickBound = '1';

        }

    };



    /*
        *  -----------------------------------------------------------  *
        *  -----  ANIMACIONES slideUp / slideDown / slideToggle  -----  *
        *  -----  para menús y otros elementos  ----------------------  *
        *  -----------------------------------------------------------  *
    */


    /**
     * --------------------------------------------------
     * -----  `slideDown(element, duration = 300)`  -----
     * --------------------------------------------------
     * - `Animación para desplegar un elemento con efecto slideDown`
     * @param {HTMLElement} element - Elemento a mostrar con efecto slideDown (debe estar inicialmente oculto con display: none)
     * @param {number} duration - Duración de la animación en milisegundos (opcional, por defecto 300ms)
     * @return {void} - No devuelve nada, pero muestra el elemento con una animación de deslizamiento hacia abajo. 
     */

    const slideDown = (element, duration = 300) => {

        //  -----  Si el elemento ya es visible, no hacemos nada  -----
        if (window.getComputedStyle(element).display !== 'none')
            return;

        //  -----  Asegurar que el elemento tenga display para calcular su altura, restaurando su estado si estaba oculto  -----
        element.style.removeProperty('display');

        /** - Òbtenemos el valor de display actual del elemento */
        let display = window.getComputedStyle(element).display;

        //  -----  Si el display es 'none', lo cambiamos a 'flex' para mostrarlo (puede ser otro valor según el diseño, pero 'flex' es común para contenedores)  -----
        if (display === 'none')
            display = 'flex';

        //  -----  Configurar estilos para la animación de slideDown  -----
        element.style.display = display;
        element.style.marginTop = '-100%';
        element.style.transitionProperty = 'margin-top';
        element.style.transitionDuration = duration + 'ms';
        element.style.transitionTimingFunction = 'cubic-bezier(0.22, 1, 0.36, 1)';
        element.style.willChange = 'margin-top';

        //  -----  Forzar reflow para asegurar que los estilos se apliquen antes de iniciar la animación  -----
        element.offsetHeight;

        //  -----  Iniciar animación de slideDown cambiando margin-top a 0  -----
        requestAnimationFrame(() => {
            element.style.marginTop = '0';
        });

        //  -----  Limpiar estilos de transición después de que termine la animación para restaurar el estado limpio del elemento  -----
        setTimeout(() => {
            element.style.removeProperty('transition-duration');
            element.style.removeProperty('transition-property');
            element.style.removeProperty('transition-timing-function');
            element.style.removeProperty('will-change');
        }, duration);

    }


    /**
     * ------------------------------------------------
     * -----  `slideUp(element, duration = 300)`  -----
     * ------------------------------------------------
     * - `Animación para ocultar un elemento con efecto slideUp`
     * @param {HTMLElement} element - Elemento a ocultar con efecto slideUp (debe estar inicialmente visible)
     * @param {number} duration - Duración de la animación en milisegundos (opcional, por defecto 300ms)
     * @return {void} - No devuelve nada, pero oculta el elemento con una animación de deslizamiento hacia arriba.
     */

    const slideUp = (element, duration = 300) => {

        //  -----  Si el elemento ya está oculto, no hacemos nada  -----
        if (window.getComputedStyle(element).display === 'none')
            return;

        //  -----  Configurar estilos para la animación de slideUp  -----
        element.style.transitionProperty = 'margin-top';
        element.style.transitionDuration = duration + 'ms';
        element.style.transitionTimingFunction = 'cubic-bezier(0.4, 0, 1, 1)';
        element.style.willChange = 'margin-top';

        //  -----  Forzar reflow para asegurar que los estilos se apliquen antes de iniciar la animación  -----
        element.offsetHeight;

        //  -----  Iniciar animación de slideUp cambiando margin-top a -100% para ocultar el elemento  -----
        requestAnimationFrame(() => {
            element.style.marginTop = '-100%';
        });

        //  -----  Después de que termine la animación, ocultar el elemento y limpiar estilos de transición para restaurar el estado limpio del elemento  -----
        setTimeout(() => {
            element.style.display = 'none';
            element.style.removeProperty('transition-duration');
            element.style.removeProperty('transition-property');
            element.style.removeProperty('transition-timing-function');
            element.style.removeProperty('will-change');
        }, duration);

    }



    /**
     * ----------------------------------------------------
     * -----  `slideToggle(element, duration = 300)`  -----
     * ----------------------------------------------------
     * - `Animación para alternar la visibilidad de un elemento con efecto slideToggle`
     * @param {HTMLElement} element - Elemento a alternar con efecto slideToggle
     * @param {number} duration - Duración de la animación en milisegundos (opcional, por defecto 300ms)
     * @return {void} - No devuelve nada, pero alterna la visibilidad del elemento con una animación de deslizamiento hacia arriba o hacia abajo según su estado actual.
     */

    const slideToggle = (element, duration = 300) => {

        //  -----  Si el elemento está oculto, lo mostramos con slideDown  -----
        if (window.getComputedStyle(element).display === 'none')
            slideDown(element, duration);

        //  -----  Si el elemento está visible, lo ocultamos con slideUp  -----
        else
            slideUp(element, duration);

    }



    /*
        *  -------------------------  *
        *  -----  STYLESHEETS  -----  *
        *  -------------------------  *
    */


    /**
     * ---------------------------------------------
     * -----  `loadStylesheetsByPage(styles)`  -----
     * ---------------------------------------------
     * - Carga múltiples hojas de estilo para una página.
     * - Elimina las anteriores marcadas como data-page-style="true".
     * - Inserta todas las nuevas del array route.styles.
    * @param {RouteStyle[]|null} styles - Array de objetos con la propiedad href para cada hoja de estilo a cargar, o null para eliminar estilos sin cargar nuevos.
     * @return {void} - No devuelve nada, pero carga las hojas de estilo especificadas para la página.
     */

    const loadStylesheetsByPage = (styles) => {

        //  -----  Si no hay estilos, elimina los existentes y salir  -----
        if (!styles || !Array.isArray(styles)) {
            document.querySelectorAll('link[data-page-style="true"]').forEach(l => l.remove());
            return;
        }

        //  -----  Eliminar hojas de estilo antiguas  -----
        document.querySelectorAll('link[data-page-style="true"]').forEach(l => l.remove());


        //  -----  Insertar nuevas hojas  -----
        for (const style of styles) {

            //  -----  Validar que el objeto de estilo tenga la propiedad href  -----
            if (!style || !style.href)
                continue;

            /** - `URL con cache-busting estable por sesión (permite reutilizar caché al revisitar la ruta)` */
            const hrefWithTimestamp = `${style.href}?t=${_sessionAssetKey}`;

            /** - `Creamos Elemento link para la hoja de estilo` */
            const link = document.createElement('link');

            //  -----  Configuramos el nuevo link para la hoja de estilo con cache bypass usando timestamp para asegurar que se actualice correctamente  -----
            link.rel = 'stylesheet';
            link.href = hrefWithTimestamp;
            link.dataset.pageStyle = "true";

            //  -----  Añadir al head  -----
            document.head.appendChild(link);

        }


        console.log("🎨 Hojas de estilo cargadas:", styles);

    };



    /*
        *  ---------------------  *
        *  -----  SCRIPTS  -----  *
        *  ---------------------  *
    */


    /**
     * ---------------------------------------------------
     * -----  `scriptSrcMatches(loadedSrc, targetSrc)`  -----
     * ---------------------------------------------------
     * - Compara dos URLs de script ignorando querystring (cache-busting).
     * @param {string} loadedSrc - URL absoluta del script en el DOM.
     * @param {string} targetSrc - URL del script definida en la ruta.
     * @returns {boolean}
     */

    const scriptSrcMatches = (loadedSrc, targetSrc) => {

        const a = loadedSrc.split('?')[0];
        const b = targetSrc.split('?')[0];

        return a.endsWith(b) || a.includes(b);

    };



    /**
     * -----------------------------------
     * -----  `isScriptLoaded(src)`  -----
     * -----------------------------------
     * - Comprueba si ya existe un script cargado (previene duplicados)
     * @param {string} src - URL del script a verificar (puede ser relativa o absoluta)
     * @returns {boolean}  - Devuelve true si el script ya está cargado en el documento, o false si no lo está o si ocurre un error durante la verificación.
     */

    const isScriptLoaded = (src) => {

        //  -----  Validación básica de la URL del script  -----
        try {

            /** @type {HTMLScriptElement[]} - `Lista de scripts actualmente cargados en el documento` */
            const list = Array.from(document.scripts);

            //  -----  Verificar si alguno de los scripts cargados coincide con la URL dada (comparando sin querystring para evitar problemas con cache bypass)  -----
            return list.some(s => s.src && scriptSrcMatches(s.src, src));

        }

        //  -----  Proteger contra errores en la verificación (por ejemplo, si src no es una cadena válida) para evitar romper el flujo global del plugin  -----
        catch (e) {
            return false;
        }

    };



    /**
     * --------------------------------------
     * -----  `removeLoadedScripts(src)`  -----
     * --------------------------------------
     * - Elimina del DOM los `<script>` que coinciden con la URL dada.
     * - Permite re-ejecutar scripts clásicos (IIFE/CJS) al volver a una ruta SPA.
     * @param {string} src - URL del script a eliminar.
     * @returns {void}
     */

    const removeLoadedScripts = (src) => {

        try {

            Array.from(document.scripts)
                .filter(s => s.src && scriptSrcMatches(s.src, src))
                .forEach(s => s.remove());

        }

        catch (e) {
            // no-op
        }

    };



    /**
     * ---------------------------------------------------------------------------------
     * -----  `loadScripts({ src, isModule = false, exportFunctionName = null })`  -----
     * ---------------------------------------------------------------------------------
     * - `Función para cargar scripts dinámicamente desde las rutas definidas en route.scripts`
     * @param {{ 
        * src: string, 
        * isModule?: boolean, 
        * exportFunctionName?: string|null 
     * }} options - Objeto con las opciones para cargar el script:
     *    - `src`: URL del script a cargar (puede ser relativa o absoluta)
     *    - `isModule`: Indica si el script debe cargarse como módulo ES6 (opcional, por defecto false)
     *    - `exportFunctionName`: Si isModule es true, nombre de la función exportada a ejecutar después de importar el módulo (opcional, por defecto null)
     * @returns {Promise<void>} - Promesa que se resuelve cuando el script se ha cargado (y ejecutado si es módulo), o se ha manejado un error para evitar bloqueos del loader.
     */

    const loadScripts = async ({ src, isModule = false, exportFunctionName = null }) => {


        //  -----  Validación básica de la URL del script  -----
        try {

            //  -----  Si no hay src, no hacemos nada  -----
            if (!src)
                return;

            //  -----  Scripts clásicos (IIFE/CJS): re-ejecutar al volver a la ruta (el DOM se reinyecta en Fase 2)  -----
            if (!isModule && isScriptLoaded(src)) {
                removeLoadedScripts(src);
                console.log(`🔄 Script clásico re-ejecutado: ${src}`);
            }

            //  -----  Evitar cargar el mismo script más de una vez para prevenir duplicados y posibles conflictos  -----
            else if (isScriptLoaded(src)) {
                console.log(`🔁 Script ya cargado: ${src}`);
                return;
            }

            
            /** - `URL con cache-busting estable por sesión (permite reutilizar caché al revisitar la ruta)` */
            const urlWithCacheBypass = `${src}?v=${_sessionAssetKey}`;


            //  -----  Cargar como módulo ES6 si isModule es true, usando import() dinámico  -----
            if (isModule) {

                //  -----  Estrategia de caché según el patrón del módulo:                                                    -----
                //  -----  · CON exportFunctionName (patrón "mount"): el módulo NO renderiza en su nivel superior, sino que    -----
                //  -----    expone una función de montaje. Usamos URL ESTABLE para que el navegador lo descargue y cachee     -----
                //  -----    UNA sola vez; el re-render se consigue llamando a esa función en cada navegación (sin re-bajar).  -----
                //  -----  · SIN exportFunctionName (patrón clásico): el módulo renderiza en su nivel superior, que solo se    -----
                //  -----    ejecuta una vez por URL. Usamos URL ÚNICA por navegación para forzar la re-evaluación (re-render). -----
                /** - `URL del módulo: estable si es "mountable" (cacheable), única por navegación si renderiza en top-level` */
                const moduleUrl = exportFunctionName
                    ? `${src}?v=${_sessionAssetKey}`
                    : `${src}?m=${_sessionAssetKey}.${++_moduleReloadSeq}`;

                /** @type {Record<string, unknown>} */
                const module = await import(moduleUrl);

                console.log(`✅ Módulo importado: ${moduleUrl}`);

                //  -----  Si se especificó exportFunctionName y es una función exportada del módulo, la ejecutamos (re-render en cada navegación)  -----
                const exported = exportFunctionName ? module[exportFunctionName] : undefined;

                if (typeof exported === 'function') {
                    exported();
                    console.log(`▶️ Función ${exportFunctionName} ejecutada del módulo.`);
                }

            }


            //  -----  Cargar como script normal  -----
            else {

                //  -----  Cargar el script dinámicamente creando un elemento script y añadiéndolo al head,  ----- 
                //  -----  con manejo de eventos onload y onerror para resolver la promesa correctamente     -----
                await new Promise((resolve) => {


                    /** - `Elemento script para cargar el JS` */
                    const script = document.createElement('script');

                    //  -----  Configurar el nuevo script con cache bypass usando timestamp para asegurar que se actualice correctamente  -----
                    script.src = urlWithCacheBypass;
                    script.async = true;

                    //  -----  Evento onload para resolver la promesa cuando el script se haya cargado correctamente  -----
                    script.onload = () => {
                        console.log(`✅ Script cargado: ${urlWithCacheBypass}`);
                        resolve(undefined);
                    };

                    //  -----  Evento onerror para manejar errores de carga del script y resolver la promesa para evitar bloqueos del loader  -----
                    script.onerror = (e) => {
                        console.error(`❌ Error al cargar: ${urlWithCacheBypass}`, e);
                        // no reject para no romper el flujo global
                        resolve(undefined);
                    };

                    //  -----  Añadir el script al head para iniciar la carga  -----
                    document.head.appendChild(script);

                });

            }

        }

        //  -----  Proteger contra errores en la carga del script para evitar romper el flujo global del plugin  -----
        catch (e) {
            console.error(`❌ Error cargando el script: ${src}`, e);
        }

    };

    

    /*
        *  ----------------------------------------------------------------  *
        *  -----  Renderizado de Markdown Shiki y Page Components          --  *
        *  -----  Su lógica se movió a preloadRouteContent (FASE 1, fetch)  --  *
        *  -----  y applyPreloadedContent (FASE 2, inyección síncrona)     --  *
        *  -----  del flujo con View Transition.                           --  *
        *  ----------------------------------------------------------------  *
    */



    /*
        *  ---------------------  *
        *  -----  EVENTOS  -----  *
        *  ---------------------  *
    */


    /**
     * -------------------------------------
     * -----  `setupEventListeners()`  -----
     * -------------------------------------
     * - `Configura los event listeners para la navegación SPA`
     *    Enlaces internos con data-id para identificar la ruta
     *    y evento popstate para manejar navegación atrás/adelante del navegador.
     * @returns {void} - No devuelve nada, pero configura los listeners para manejar la navegación dentro de la SPA,
     *    permitiendo que los enlaces internos carguen contenido sin recargar la página y que la navegación con los botones del navegador funcione correctamente. 
     */

    const setupEventListeners = () => {


        //  -----  Manejo de clics en enlaces internos  -----
        document.addEventListener('click', (e) => {


            /** - `Elemento objetivo del evento click` */
            const target = e.target;

            //  -----  Si el elemento clicado no es un HTMLElement, no hacemos nada  -----
            if (!(target instanceof HTMLElement))
                return;

            /** 
             * @type {HTMLAnchorElement|null} 
             * - `Busca el enlace más cercano con data-id o data-route para identificar la ruta, 
             *    permitiendo que los enlaces internos funcionen sin recargar la página`  
             */
            const link = target.closest('a[data-id]');

            //  -----  Si se encuentra un enlace con data-id, manejamos la navegación interna con lazy loading  -----
            if (link) {

                e.preventDefault();

                /** - `Nombre del archivo de ruta desde data-route (ej: 'route-01-01-inferir-tipos')` */
                const routeFile = link.dataset.route;

                /** - `ID de la ruta desde data-id (ej: 'inferirTipos')` */
                const routeId = link.dataset.id;


                //  -----  Si tiene data-route, importar directamente por nombre de archivo  -----
                if (routeFile) {

                    loadRouteModule(routeFile).then((route) => {

                        if (route)
                            loadContent(route);
                        else
                            loadNotFoundRoute('click');

                    }).catch(() => {
                        loadNotFoundRoute('click');
                    });

                }

                //  -----  Fallback: si solo tiene data-id, buscar en el manifest por id  -----
                else if (routeId) {

                    /** - `Entrada del manifest correspondiente al id` */
                    const entry = findManifestEntryById(routeId);

                    if (entry) {

                        loadRouteModule(entry.file).then((route) => {

                            if (route)
                                loadContent(route);
                            else
                                loadNotFoundRoute('click');

                        }).catch(() => {
                            loadNotFoundRoute('click');
                        });

                    } else {
                        loadNotFoundRoute('click');
                    }

                }

            }

        });


        //  -----  Manejo del evento popstate (navegación atrás/adelante)  -----
        window.addEventListener('popstate', (e) => {

            //  -----  Marcar que la navegación se hizo por popstate para evitar pushState duplicados al aplicar la ruta  -----
            isPopNavigation = true;

            //  -----  Actualizar favicon inmediatamente (síncronamente) desde el state para evitar parpadeo durante el async de lazy loading  -----
            if (e.state?.favicon)
                updateFavicon(e.state.favicon);

            /** - `Nombre del archivo de ruta guardado en el historial` */
            const routeFile = e.state?.routeFile;

            /** - `Path actual desde el estado del historial o fallback a pathname` */
            const raw = e.state?.path ?? window.location.pathname;


            //  -----  Si tenemos el routeFile en el state, importar directamente (más rápido, usa cache)  -----
            if (routeFile) {

                loadRouteModule(routeFile).then((route) => {

                    if (route)
                        loadContent(route);
                    else
                        loadNotFoundRoute('popstate');

                }).catch(() => {
                    loadNotFoundRoute('popstate');
                });

            }

            //  -----  Fallback: buscar en el manifest por pathname normalizado  -----
            else {

                /** - `Entrada del manifest correspondiente al path actual` */
                const entry = findManifestEntryByPath(raw);

                if (entry) {

                    loadRouteModule(entry.file).then((route) => {

                        if (route)
                            loadContent(route);
                        else
                            loadNotFoundRoute('popstate');

                    }).catch(() => {
                        loadNotFoundRoute('popstate');
                    });

                } else {
                    loadNotFoundRoute('popstate');
                }

            }

        });

    };



    /*
        *  -----------------------------------------
        *  ----------  Iniciar el plugin  ----------
        *  -----------------------------------------
    */


    init();

}
