// @ts-nocheck
/*
    *  -----------------------------------------------------------------------------  *
    *  -----  /astro-page.cjs.js  --  /src/scripts/js/pages/astro-page.cjs.js  -----  *
    *  -----------------------------------------------------------------------------  *
    *
    *  Script CommonJS (IIFE) — Utilidades Astro para la página.
    *  Renderiza contenido en astro-demo.html tras la carga del plugin SPA V3.1.
*/


/**
 * -----  Características demo renderizadas por CJS  -----
 * @typedef {Object} AstroFeature
 * @property {string} icon
 * @property {string} title
 * @property {string} text
 */



(() => {

    console.log('\n');
    console.warn('-----  astro-page.cjs.js  -----  CommonJS (IIFE)  -----');
    console.log('\n');


    //*  -----  Constantes  -----

    /** Versión del script */
    const VERSION = '1.0.0';
    
    /** Nombre del plugin SPA */
    const PLUGIN = 'spa-loader-content-html v3.1';

    /** @type {AstroFeature[]} - Características demo renderizadas por CJS */
    const ASTRO_FEATURES = [
        {
            icon: '🏝️',
            title: 'Islands Architecture',
            text: 'Hidrata solo los componentes interactivos. El resto del HTML permanece estático, como en Astro.',
        },
        {
            icon: '⚡',
            title: 'Zero JavaScript',
            text: 'Por defecto Astro no envía JS al navegador. Aquí el script CJS se carga solo en esta ruta.',
        },
        {
            icon: '📦',
            title: 'Script clásico (IIFE)',
            text: 'Patrón CommonJS con closure: se ejecuta tras applyRouteMetaAsync cuando el DOM ya está listo.',
        },
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

        //  -----  Asignar atributos  -----
        if (attrs) {
            Object.keys(attrs).forEach((key) => {
                el.setAttribute(key, attrs[key]);
            });
        }

        //  -----  Agregar contenido  -----
        if (text) {
            el.appendChild(createText(text));
        }

        //  -----  Retornar el elemento creado  -----
        return el;
    };




    /**
     * ------------------------------------------
     * -----  `createFeatureCard(feature)`  -----
     * ------------------------------------------
     * - Crea una tarjeta de feature con el markup del componente Astro demo.
     * @param {AstroFeature} feature - Característica a renderizar
     * @returns {HTMLElement} - Tarjeta de feature creada
     */

    const createFeatureCard = (feature) => {
        
        /** - Tarjeta de feature creada */
        const article = createElement('article', { class: 'astro-page__feature' });

        //  -----  Agregar contenido  -----
        article.appendChild(createElement('span', { class: 'astro-page__feature-icon', 'aria-hidden': 'true' }, feature.icon));
        article.appendChild(createElement('h4', { class: 'astro-page__feature-title' }, feature.title));
        article.appendChild(createElement('p', { class: 'astro-page__feature-text' }, feature.text));

        //  -----  Retornar la tarjeta de feature creada  -----
        return article;
    };



    /**
     * ------------------------------------------
     * -----  `createIslandCounterCard()`  -----
     * ------------------------------------------
     * - Crea la tarjeta interactiva tipo “island” con contador.
     * @returns {HTMLElement}- Tarjeta interactiva tipo “island” con contador creada
     */

    const createIslandCounterCard = () => {
        
        /** - Contador de clicks */
        let count = 0;
        
        
        /** @type {HTMLArticleElement} - Tarjeta interactiva tipo “island” con contador creada */
        const article = createElement('article', { class: 'astro-page__feature' });
        
        /** @type {HTMLStrongElement} - Salida de texto */
        const output = createElement('strong', { class: 'astro-page__feature-title' }, '0');
        
        /** @type {HTMLButtonElement} - Botón de incremento */
        const button = createElement('button', {
            type: 'button',
            class: 'astro-page__concept',
            'aria-label': 'Incrementar contador de la isla CJS',
        }, 'client:load — Click');


        //  -----  Agregar evento de click  -----
        button.addEventListener('click', () => {
            count += 1;
            output.textContent = String(count);
        });

        
        //  -----  Agregar contenido  -----
        article.appendChild(createElement('span', { class: 'astro-page__feature-icon', 'aria-hidden': 'true' }, '🧩'));
        article.appendChild(createElement('h4', { class: 'astro-page__feature-title' }, 'Isla interactiva CJS'));
        article.appendChild(createElement('p', { class: 'astro-page__feature-text' }, 'Simula client:load con un contador hidratado por el script clásico.'));

        /** @type {HTMLParagraphElement} - Línea de texto de clicks */
        const clicksLine = createElement('p', { class: 'astro-page__feature-text' });
        
        //  -----  Agregar contenido  -----
        clicksLine.appendChild(createText('Clicks: '));
        clicksLine.appendChild(output);

        article.appendChild(clicksLine);
        article.appendChild(button);

        //  -----  Retornar la tarjeta interactiva tipo “island” con contador creada  -----
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
        
        //  ----- Si el elemento de estado no existe, retornar  -----
        if (!statusEl) 
            return;
        
        //  -----  Actualizar el contenido del elemento de estado  -----
        statusEl.textContent = message;
    }



    /**
     * ------------------------------------
     * -----  `renderAstroDemoCjs()`  -----
     * ------------------------------------
     * - Renderiza las tarjetas CJS en astro-demo.html.
     */

    const renderAstroDemoCjs = () => {

        /** - Contenedor de las tarjetas CJS */
        const target = document.querySelector('[data-astro-demo-target="cjs"]');

        /** - Elemento de estado */
        const status = document.querySelector('[data-astro-demo-status="cjs"]');

        //  -----  Si el contenedor de las tarjetas CJS no existe, retornar  -----
        if (!target) {
            console.warn('⚠️ astro-page.cjs.js: contenedor [data-astro-demo-target="cjs"] no encontrado.');
            return;
        }


        /** - Fragmento de documento para insertar las tarjetas CJS */
        const fragment = document.createDocumentFragment();

        //  -----  Agregar las tarjetas de características  -----
        ASTRO_FEATURES.forEach((feature) => {
            fragment.appendChild(createFeatureCard(feature));
        });

        //  -----  Agregar la tarjeta interactiva tipo “island” con contador  -----
        fragment.appendChild(createIslandCounterCard());

        //  -----  Reemplazar el contenido del contenedor de las tarjetas CJS  -----
        target.replaceChildren(fragment);

        //  -----  Actualizar el mensaje de estado  -----
        setStatus(
            status,
            `Renderizado con astro-page.cjs.js (IIFE) · ${PLUGIN} · v${VERSION} · ${new Date().toLocaleTimeString()}`
        );

        console.log('-----  astro-page.cjs.js — DOM renderizado en astro-demo  -----');
        console.log('Tarjetas CJS:', ASTRO_FEATURES.length + 1);

    };


    //  -----  Renderizar las tarjetas CJS  -----
    renderAstroDemoCjs();

    console.log('\n');

})();
