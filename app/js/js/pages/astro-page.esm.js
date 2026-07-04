/*
    *  -----------------------------------------------------------------------------  *
    *  -----  /astro-page.esm.js  --  /src/scripts/js/pages/astro-page.esm.js  -----  *
    *  -----------------------------------------------------------------------------  *
    *
    *  Script ESM (ES Modules) — Utilidades Astro exportadas como módulo nativo.
    *  Renderiza contenido en astro-demo.html tras la carga del plugin SPA V3.1.
*/


/**
 * -----  Características demo renderizadas por ESM  -----
 * @typedef {Object} AstroFeature
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

/** Directivas client:* de Astro */
export const CLIENT_DIRECTIVES = Object.freeze([
    'client:load',
    'client:idle',
    'client:visible',
    'client:media',
    'client:only',
]);


/** Características demo renderizadas por ESM */
export const ASTRO_ESM_FEATURES = Object.freeze([
    {
        icon: '🎯',
        title: 'ES Modules nativos',
        text: 'Este script se carga con <script type="module"> e import/export estándar.',
    },
    {
        icon: '🔄',
        title: 'Fase 3 del plugin',
        text: 'applyRouteMetaAsync ejecuta los scripts cuando pagesComponents ya inyectó astro-demo.html.',
    },
    {
        icon: '📡',
        title: 'Evento spa:route-loaded',
        text: 'El plugin emite spa:route-loaded al terminar. Escúchalo para inicializar lógica adicional.',
    },
]);



//*  -----  Funciones exportadas  -----


/**
 * -----------------------------------------------------------
 * -----  `createFeatureArticle({ icon, title, text })`  -----
 * -----------------------------------------------------------
 * - Crea una tarjeta de feature para el grid del demo.
 * @param {AstroFeature} feature - Característica a renderizar
 * @returns {HTMLElement} - Tarjeta de feature creada
 */

export const createFeatureArticle = ({ icon, title, text }) => {

    /** @type {HTMLArticleElement} - Tarjeta de feature creada */
    const article = document.createElement('article');
    
    article.className = 'astro-page__feature';

    //  -----  Agregar contenido  -----
    article.innerHTML = `
        <span class="astro-page__feature-icon" aria-hidden="true">${icon}</span>
        <h4 class="astro-page__feature-title">${title}</h4>
        <p class="astro-page__feature-text">${text}</p>
    `;

    //  -----  Retornar la tarjeta de feature creada  -----
    return article;
};



/**
 * ---------------------------------------------
 * -----  `createDirectiveTag(directive)`  -----
 * ---------------------------------------------
 * - Crea un ítem de lista para directivas client:*.
 * @param {string} directive - Directiva Astro a renderizar
 * @returns {HTMLLIElement} - Ítem de lista creado
 */

export const createDirectiveTag = (directive) => {

    /** @type {HTMLLIElement} - Ítem de lista creado */
    const item = document.createElement('li');
    
    //  -----  Agregar atributos  -----
    item.className = 'astro-page__concept';
    item.textContent = directive;
    item.title = `Directiva Astro ${directive}`;

    //  -----  Retornar el ítem de lista creado  -----
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

    //  -----  Si el elemento de estado no existe, retornar  -----
    if (!statusEl)
        return;

    //  -----  Actualizar el contenido del elemento de estado  -----
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
    
    //  -----  Agregar atributos  -----
    article.className = 'astro-page__feature';

    /** @type {HTMLParagraphElement} - Salida de texto del evento */
    const output = document.createElement('p');
    
    //  -----  Agregar atributos  -----
    output.className = 'astro-page__feature-text';
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

        //  -----  Actualizar la salida de texto  -----
        output.innerHTML = `Evento recibido: ruta activa <code>${routeId}</code>`;
    };

    //  -----  Suscribirse al evento spa:route-loaded (una sola vez)  -----
    document.addEventListener('spa:route-loaded', onRouteLoaded, { once: true });

    //  -----  Agregar contenido  -----
    article.innerHTML = `
        <span class="astro-page__feature-icon" aria-hidden="true">📡</span>
        <h4 class="astro-page__feature-title">Integración SPA</h4>
    `;

    //  -----  Agregar contenido  -----
    article.appendChild(output);

    //  -----  Retornar la tarjeta de integración SPA creada  -----
    return article;

};



/**
 * ------------------------------------
 * -----  `renderAstroDemoEsm()`  -----
 * ------------------------------------
 * - Renderiza las tarjetas ESM en astro-demo.html.
 */

export const renderAstroDemoEsm = () => {

    /** - Contenedor de las tarjetas ESM */
    const target = document.querySelector('[data-astro-demo-target="esm"]');

    /** - Elemento de estado */
    const status = document.querySelector('[data-astro-demo-status="esm"]');

    //  -----  Si el contenedor de las tarjetas ESM no existe, retornar  -----
    if (!target) {
        console.warn('⚠️ astro-page.esm.js: contenedor [data-astro-demo-target="esm"] no encontrado.');
        return;
    }

    /** - Fragmento de documento para insertar las tarjetas ESM */
    const fragment = document.createDocumentFragment();

    //  -----  Agregar las tarjetas de características  -----
    ASTRO_ESM_FEATURES.forEach((feature) => {
        fragment.appendChild(createFeatureArticle(feature));
    });

    //  -----  Agregar la tarjeta de integración SPA  -----
    fragment.appendChild(createRouteLoadedCard());

    //  -----  Reemplazar el contenido del contenedor de las tarjetas ESM  -----
    target.replaceChildren(fragment);

    //  -----  Actualizar el mensaje de estado  -----
    setDemoStatus(
        status,
        `Renderizado con astro-page.esm.js (ESM) · ${PLUGIN_NAME} v${PLUGIN_VERSION} · v${VERSION} · ${new Date().toLocaleTimeString()}`
    );

    console.warn('-----  astro-page.esm.js  -----  ES Module  -----');
    console.log('Tarjetas ESM:', ASTRO_ESM_FEATURES.length + 1);
};



/**
 * ----------------------------------------
 * -----  `renderClientDirectives()`  -----
 * ----------------------------------------
 * - Renderiza las directivas client:* en la lista del demo.
 */

export const renderClientDirectives = () => {

    /** - Contenedor de las directivas client:* */
    const target = document.querySelector('[data-astro-demo-target="directives"]');

    //  -----  Si el contenedor de directivas no existe, retornar  -----
    if (!target) {
        console.warn('⚠️ astro-page.esm.js: contenedor [data-astro-demo-target="directives"] no encontrado.');
        return;
    }

    /** - Fragmento de documento para insertar las directivas */
    const fragment = document.createDocumentFragment();

    //  -----  Agregar cada directiva client:*  -----
    CLIENT_DIRECTIVES.forEach((directive) => {
        fragment.appendChild(createDirectiveTag(directive));
    });

    //  -----  Reemplazar el contenido del contenedor de directivas  -----
    target.replaceChildren(fragment);
};


//  -----  Inicialización del demo (Fase 3 — DOM ya mutado)  -----

renderAstroDemoEsm();
renderClientDirectives();



//  -----  Export default  -----

export default {
    VERSION,
    PLUGIN_NAME,
    PLUGIN_VERSION,
    CLIENT_DIRECTIVES,
    ASTRO_ESM_FEATURES,
    createFeatureArticle,
    createDirectiveTag,
    setDemoStatus,
    renderAstroDemoEsm,
    renderClientDirectives,
};
