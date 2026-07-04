/*
    *  -----  /html-page.esm.js  --  /src/scripts/js/pages/html-page.esm.js  -----
    *
    *  Script ESM (ES Modules) — Utilidades HTML5 exportadas como módulo nativo.
    *  Renderiza contenido en html-demo.html tras la carga del plugin SPA V3.1.
*/


/**
 * -----  Características demo renderizadas por ESM  -----
 * @typedef {Object} PageFeature
 * @property {string} icon
 * @property {string} title
 * @property {string} text
 */


/**
 * -----  Detalle del evento spa:route-loaded  -----
 * @typedef {Object} RouteLoadedDetail
 * @property {{ id?: string }} [route]
 */


//*  -----  Constantes exportadas  -----

/** Versión del módulo */
export const VERSION = '1.0.0';

/** Nombre del plugin SPA */
export const PLUGIN_NAME = 'spa-loader-content-html';

/** Versión del plugin SPA usada en la demo */
export const PLUGIN_VERSION = '3.1';

/** Etiquetas / conceptos renderizados por ESM */
export const PAGE_TAGS = Object.freeze([
    "header",
    "nav",
    "main",
    "section",
    "article",
    "aside",
    "footer",
    "figure",
    "figcaption",
    "time"
]);

/** Características demo renderizadas por ESM */
export const PAGE_ESM_FEATURES = Object.freeze([
    {
        "icon": "🔗",
        "title": "Atributos data-*",
        "text": "Los contenedores del demo usan data-html-demo-target para el renderizado."
    },
    {
        "icon": "🔄",
        "title": "Fase 3 del plugin",
        "text": "El módulo ESM se carga cuando pagesComponents ya inyectó html-demo.html."
    },
    {
        "icon": "📡",
        "title": "Evento spa:route-loaded",
        "text": "Integración con el ciclo de vida del plugin SPA V3.1."
    }
]);



//*  -----  Funciones exportadas  -----


/**
 * -----------------------------------------------------------
 * -----  `createFeatureArticle({ icon, title, text })`  -----
 * -----------------------------------------------------------
 * - Crea una tarjeta de feature para el grid del demo.
 * @param {PageFeature} feature - Característica a renderizar
 * @returns {HTMLElement} - Tarjeta de feature creada
 */
export const createFeatureArticle = ({ icon, title, text }) => {

    /** @type {HTMLArticleElement} - Tarjeta de feature creada */
    const article = document.createElement('article');
    article.className = 'html-page__feature';

    article.innerHTML = `
        <span class="html-page__feature-icon" aria-hidden="true">${icon}</span>
        <h4 class="html-page__feature-title">${title}</h4>
        <p class="html-page__feature-text">${text}</p>
    `;

    return article;
};



/**
 * ---------------------------------------------
 * -----  `createTagItem(label)`  -----
 * ---------------------------------------------
 * - Crea un ítem de lista para tags o conceptos.
 * @param {string} label - Texto del ítem
 * @returns {HTMLLIElement} - Ítem de lista creado
 */
export const createTagItem = (label) => {

    /** @type {HTMLLIElement} - Ítem de lista creado */
    const item = document.createElement('li');
    item.className = 'html-page__tag';
    item.textContent = label;
    item.title = label;

    return item;
};



/**
 * ------------------------------------------------
 * -----  `setDemoStatus(statusEl, message)`  -----
 * ------------------------------------------------
 * - Actualiza el mensaje de estado del bloque ESM.
 * @param {Element|null} statusEl - Elemento de estado
 * @param {string} message - Mensaje de estado
 */
export const setDemoStatus = (statusEl, message) => {

    if (!statusEl)
        return;

    statusEl.textContent = message;
};



/**
 * ---------------------------------------
 * -----  `createRouteLoadedCard()`  -----
 * ---------------------------------------
 * - Tarjeta que escucha spa:route-loaded y muestra el id de la ruta activa.
 * @returns {HTMLElement} - Tarjeta de integración SPA creada
 */
const createRouteLoadedCard = () => {

    /** @type {HTMLArticleElement} - Tarjeta de integración SPA creada */
    const article = document.createElement('article');
    article.className = 'html-page__feature';

    /** @type {HTMLParagraphElement} - Salida de texto del evento */
    const output = document.createElement('p');
    output.className = 'html-page__feature-text';
    output.innerHTML = 'Esperando evento <code>spa:route-loaded</code>…';


    /**
     * ------------------------------------
     * -----  `onRouteLoaded(event)`  -----
     * ------------------------------------
     * - Actualiza la tarjeta con el id de la ruta emitida por el plugin.
     * @param {Event} event - Evento spa:route-loaded
     */
    const onRouteLoaded = (event) => {

        /** @type {RouteLoadedDetail} - Detalle del evento spa:route-loaded */
        const detail = /** @type {CustomEvent<RouteLoadedDetail>} */ (event).detail;

        /** @type {string} - Id de la ruta activa */
        const routeId = detail?.route?.id ?? 'desconocida';

        output.innerHTML = `Evento recibido: ruta activa <code>${routeId}</code>`;
    };

    document.addEventListener('spa:route-loaded', onRouteLoaded, { once: true });

    article.innerHTML = `
        <span class="html-page__feature-icon" aria-hidden="true">📡</span>
        <h4 class="html-page__feature-title">Integración SPA</h4>
    `;
    article.appendChild(output);

    return article;
};



/**
 * ------------------------------------
 * -----  `renderPageDemoEsm()`  -----
 * ------------------------------------
 * - Renderiza las tarjetas ESM en html-demo.html.
 */
export const renderPageDemoEsm = () => {

    /** - Contenedor de las tarjetas ESM */
    const target = document.querySelector('[data-html-demo-target="esm"]');

    /** - Elemento de estado */
    const status = document.querySelector('[data-html-demo-status="esm"]');

    if (!target) {
        console.warn('⚠️ html-page.esm.js: contenedor [data-html-demo-target="esm"] no encontrado.');
        return;
    }

    /** - Fragmento de documento para insertar las tarjetas ESM */
    const fragment = document.createDocumentFragment();

    PAGE_ESM_FEATURES.forEach((feature) => {
        fragment.appendChild(createFeatureArticle(feature));
    });

    fragment.appendChild(createRouteLoadedCard());

    target.replaceChildren(fragment);

    setDemoStatus(
        status,
        `Renderizado con html-page.esm.js (ESM) · ${PLUGIN_NAME} v${PLUGIN_VERSION} · v${VERSION} · ${new Date().toLocaleTimeString()}`
    );

    console.warn('-----  html-page.esm.js  -----  ES Module  -----');
    console.log('Tarjetas ESM:', PAGE_ESM_FEATURES.length + 1);
};



/**
 * ----------------------------------------
 * -----  `renderPageTags()`  -----
 * ----------------------------------------
 * - Renderiza tags o conceptos en la lista del demo.
 */
export const renderPageTags = () => {

    /** - Contenedor de tags / conceptos */
    const target = document.querySelector('[data-html-demo-target="tags"]');

    if (!target) {
        console.warn('⚠️ html-page.esm.js: contenedor [data-html-demo-target="tags"] no encontrado.');
        return;
    }

    /** - Fragmento de documento para insertar los ítems */
    const fragment = document.createDocumentFragment();

    PAGE_TAGS.forEach((label) => {
        fragment.appendChild(createTagItem(label));
    });

    target.replaceChildren(fragment);
};


/**
 * ------------------------
 * -----  `mount()`  -----
 * ------------------------
 * - `Punto de montaje del módulo, invocado por el plugin en cada navegación (exportFunctionName: 'mount').`
 * - `Al vivir el render dentro de una función (y NO en el nivel superior del módulo), el navegador puede`
 * - `cachear el módulo y descargarlo una sola vez; el plugin re-renderiza llamando a mount() en cada`
 * - `visita o retroceso del historial, sin re-descargar el archivo.`
 * @returns {void}
 */
export const mount = () => {
    renderPageDemoEsm();
    renderPageTags();
};



//  -----  Export default  -----

export default {
    VERSION,
    PLUGIN_NAME,
    PLUGIN_VERSION,
    PAGE_TAGS,
    PAGE_ESM_FEATURES,
    createFeatureArticle,
    createTagItem,
    setDemoStatus,
    renderPageDemoEsm,
    renderPageTags,
    mount,
};
