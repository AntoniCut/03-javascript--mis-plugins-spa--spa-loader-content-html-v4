// @ts-nocheck
/*
    *  -----  /html-page.cjs.js  --  /src/scripts/js/pages/html-page.cjs.js  -----
    *
    *  Script CommonJS (IIFE) — Utilidades HTML5 para la página.
    *  Renderiza contenido en html-demo.html tras la carga del plugin SPA V3.1.
*/


/**
 * -----  Características demo renderizadas por CJS  -----
 * @typedef {Object} PageFeature
 * @property {string} icon
 * @property {string} title
 * @property {string} text
 */



(() => {

    console.log('\n');
    console.warn('-----  html-page.cjs.js  -----  CommonJS (IIFE)  -----');
    console.log('\n');


    //*  -----  Constantes  -----

    /** Versión del script */
    const VERSION = '1.0.0';

    /** Nombre del plugin SPA */
    const PLUGIN = 'spa-loader-content-html v3.1';

    /** @type {PageFeature[]} - Características demo renderizadas por CJS */
    const PAGE_FEATURES = [
                {
                        "icon": "🏗️",
                        "title": "DOM API",
                        "text": "createElement, appendChild y textContent desde un IIFE clásico."
                },
                {
                        "icon": "📝",
                        "title": "Semántica HTML5",
                        "text": "Estructura accesible generada dinámicamente en el demo."
                },
                {
                        "icon": "📦",
                        "title": "Script clásico (IIFE)",
                        "text": "Patrón CommonJS ejecutado tras la mutación del DOM."
                }
        ];


    //*  -----  Utilidades DOM  -----


    /**
     * --------------------------------
     * -----  `createText(text)`  -----
     * --------------------------------
     * - Crea un nodo de texto seguro.
     * @param {string} text
     * @returns {Text}
     */
    const createText = (text) => document.createTextNode(text);



    /**
     * -----------------------------------------------
     * -----  `createElement(tag, attrs, text)`  -----
     * -----------------------------------------------
     * Crea un elemento con atributos y contenido opcional.
     * @param {string} tag - Nombre del elemento
     * @param {Record<string, string>} [attrs] - Atributos del elemento
     * @param {string} [text] - Contenido del elemento
     * @returns {HTMLElement} - Elemento creado
     */
    const createElement = (tag, attrs, text) => {

        /** - Elemento creado */
        const el = document.createElement(tag);

        if (attrs) {
            Object.keys(attrs).forEach((key) => {
                el.setAttribute(key, attrs[key]);
            });
        }

        if (text) {
            el.appendChild(createText(text));
        }

        return el;
    };




    /**
     * ------------------------------------------
     * -----  `createFeatureCard(feature)`  -----
     * ------------------------------------------
     * - Crea una tarjeta de feature con el markup del demo.
     * @param {PageFeature} feature - Característica a renderizar
     * @returns {HTMLElement} - Tarjeta de feature creada
     */
    const createFeatureCard = (feature) => {

        /** - Tarjeta de feature creada */
        const article = createElement('article', { class: 'html-page__feature' });

        article.appendChild(createElement('span', { class: 'html-page__feature-icon', 'aria-hidden': 'true' }, feature.icon));
        article.appendChild(createElement('h4', { class: 'html-page__feature-title' }, feature.title));
        article.appendChild(createElement('p', { class: 'html-page__feature-text' }, feature.text));

        return article;
    };



    /**
     * ------------------------------------------
     * -----  `createIslandCounterCard()`  -----
     * ------------------------------------------
     * - Crea la tarjeta interactiva con contador.
     * @returns {HTMLElement} - Tarjeta interactiva creada
     */
    const createIslandCounterCard = () => {

        /** - Contador de clicks */
        let count = 0;

        /** @type {HTMLArticleElement} - Tarjeta interactiva creada */
        const article = createElement('article', { class: 'html-page__feature' });

        /** @type {HTMLStrongElement} - Salida de texto */
        const output = createElement('strong', { class: 'html-page__feature-title' }, '0');

        /** @type {HTMLButtonElement} - Botón de incremento */
        const button = createElement('button', {
            type: 'button',
            class: 'html-page__tag',
            'aria-label': 'Incrementar contador de la isla CJS',
        }, 'Click — CJS');

        button.addEventListener('click', () => {
            count += 1;
            output.textContent = String(count);
        });

        article.appendChild(createElement('span', { class: 'html-page__feature-icon', 'aria-hidden': 'true' }, '🧩'));
        article.appendChild(createElement('h4', { class: 'html-page__feature-title' }, 'Isla interactiva CJS'));
        article.appendChild(createElement('p', { class: 'html-page__feature-text' }, 'Contador de clicks creado con nodos DOM puros en html-demo.html.'));

        /** @type {HTMLParagraphElement} - Línea de texto de clicks */
        const clicksLine = createElement('p', { class: 'html-page__feature-text' });
        clicksLine.appendChild(createText('Clicks: '));
        clicksLine.appendChild(output);

        article.appendChild(clicksLine);
        article.appendChild(button);

        return article;
    };



    /**
     * --------------------------------------------
     * -----  `setStatus(statusEl, message)`  -----
     * --------------------------------------------
     * - Actualiza el mensaje de estado del bloque CJS.
     * @param {Element|null} statusEl - Elemento de estado
     * @param {string} message - Mensaje de estado
     */
    const setStatus = (statusEl, message) => {

        if (!statusEl)
            return;

        statusEl.textContent = message;
    };



    /**
     * ------------------------------------
     * -----  `renderPageDemoCjs()`  -----
     * ------------------------------------
     * - Renderiza las tarjetas CJS en html-demo.html.
     */
    const renderPageDemoCjs = () => {

        /** - Contenedor de las tarjetas CJS */
        const target = document.querySelector('[data-html-demo-target="cjs"]');

        /** - Elemento de estado */
        const status = document.querySelector('[data-html-demo-status="cjs"]');

        if (!target) {
            console.warn('⚠️ html-page.cjs.js: contenedor [data-html-demo-target="cjs"] no encontrado.');
            return;
        }

        /** - Fragmento de documento para insertar las tarjetas CJS */
        const fragment = document.createDocumentFragment();

        PAGE_FEATURES.forEach((feature) => {
            fragment.appendChild(createFeatureCard(feature));
        });

        fragment.appendChild(createIslandCounterCard());

        target.replaceChildren(fragment);

        setStatus(
            status,
            `Renderizado con html-page.cjs.js (IIFE) · ${PLUGIN} · v${VERSION} · ${new Date().toLocaleTimeString()}`
        );

        console.log('-----  html-page.cjs.js — DOM renderizado en html-demo  -----');
        console.log('Tarjetas CJS:', PAGE_FEATURES.length + 1);
    };


    renderPageDemoCjs();

    console.log('\n');

})();
