/*
    *  ------------------------------------------------------------------------------  *
    *  -----  /effect-loading-page.js  --  /src/scripts/effect-loading-page.js  -----  *
    *  ------------------------------------------------------------------------------  *
*/

/** @typedef {import('../../types/index.js').WaitForFirstSpaRouteLoadedOptions} WaitForFirstSpaRouteLoadedOptions */



/**
 * -----------------------------------
 * -----  `effectLoadingPage()`  -----
 * -----------------------------------
 * 
 * - Implementa un efecto de carga para la página web.
 * - Muestra un loader mientras se carga el contenido principal.
 * - Aplica transiciones suaves entre el loader y el contenido principal.
 * 
 */

export const effectLoadingPage = () => {

    /** @type {Window & { __spaFirstRouteLoaded?: boolean }} */
    const browserWindow = window;


    console.log('\n')
    console.warn('-----  effect-loading-page.js  -----');
    console.log('\n');


    /**
     * -----------------------------------
     * -----  `whenDocumentReady()`  -----
     * -----------------------------------
     * - Espera a que el DOM este listo antes de consultar nodos del layout.
     * @returns {Promise<void>} Promesa resuelta cuando el documento esta listo.
     */
    
     const whenDocumentReady = () => {
        
        if (document.readyState !== 'loading') 
            return Promise.resolve();
        

        return new Promise((resolve) => {
            document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
        });
    };


    /**
     * ---------------------------------------------------------------------
     * -----  `waitForFirstSpaRouteLoaded({ timeoutMs = 6000 } = {})`  -----
     * ---------------------------------------------------------------------
     * 
     * - Espera la primera carga de ruta SPA y aplica fallback seguro por error o timeout.
     *
     * - Escucha:
     * - `spa:first-route-loaded`: flujo exitoso de carga inicial.
     * - `spa:route-load-error`: flujo de error durante carga inicial.
     *
     * - Si no llega ninguno en el tiempo indicado, resuelve por timeout para no dejar
     *   el loader bloqueado indefinidamente.
     *
     * @param {WaitForFirstSpaRouteLoadedOptions} [options={}] Configuracion de espera.
     * @returns {Promise<void>} Promesa resuelta cuando finaliza la espera (ok, error o timeout).
     */

    const waitForFirstSpaRouteLoaded = ({ timeoutMs = 6000 } = {}) => {
        
        //  -----  Si ya se cargo la primera ruta SPA, no es necesario esperar -----
        if (browserWindow.__spaFirstRouteLoaded) 
            return Promise.resolve();
        

        //  -----  Si no, se espera el evento o el timeout -----
        return new Promise((resolve) => {

            /** - `Indica si la promesa ya se resolvio` */
            let settled = false;


            /** 
             * -----------------------------
             * -----  `resolveOnce()`  -----
             * -----------------------------
             * Resuelve la promesa una sola vez.
             * @returns {void} 
             */

            const resolveOnce = () => {
                
                if (settled)
                    return;

                settled = true;
                clearTimeout(timeoutId);
                resolve(undefined);
            };


            /** 
             * ------------------------------------
             * -----  `onFirstRouteLoaded()`  -----
             * ------------------------------------
             * @returns {void} 
             */

            const onFirstRouteLoaded = () => {
                resolveOnce();
            };


            /**
             * --------------------------------------
             * -----  `onRouteLoadError()`  -----
             * --------------------------------------
             * - Maneja errores en la carga inicial de la ruta SPA. 
             * @param {Event} event 
             */

            const onRouteLoadError = (event) => {
                console.error('Error en carga inicial de ruta SPA:', event);
                resolveOnce();
            };


            /**- Maneja el timeout de espera de la primera ruta SPA */
            const timeoutId = setTimeout(() => {
                
                console.warn(`Timeout esperando primera ruta SPA (${timeoutMs}ms). Se oculta el loader por fallback.`);
                resolveOnce();

            }, timeoutMs);

            document.addEventListener('spa:first-route-loaded', onFirstRouteLoaded, { once: true });
            document.addEventListener('spa:route-load-error', onRouteLoadError, { once: true });

        });
        
    };



    /**
     * -------------------------
     * -----  `delay(ms)`  -----
     * -------------------------
     * Suspende la ejecucion durante `ms` milisegundos.
     *
     * @param {number} ms Tiempo de espera en milisegundos.
     * @returns {Promise<void>} Promesa resuelta al finalizar la espera.
     */
    
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


    /**
     * ----------------------------------
     * -----  `runLoadingEffect()`  -----
     * ----------------------------------
     * @async
     * Ejecuta el flujo completo del loader inicial.
     *
     * Secuencia:
     * 1. Espera DOM listo.
     * 2. Obtiene `#loader` y `#layout`.
     * 3. Espera primera carga SPA (o fallback).
     * 4. Aplica transiciones visuales (`fade-in`/`fade-out`).
     * 5. Elimina el loader al terminar su transicion.
     *
     * @returns {Promise<void>} Promesa del flujo de carga inicial.
     */
    const runLoadingEffect = async () => {

        await whenDocumentReady();

        /** @type {HTMLElement | null} */
        const loader = document.querySelector('#loader');

        /** @type {HTMLElement | null} */
        const layout = document.querySelector('#layout');

        if (!loader || !layout) {
            console.error('Loader o layout no encontrado en el DOM');
            return;
        }

        // Espera la primera carga completa de componentes SPA.
        await waitForFirstSpaRouteLoaded({ timeoutMs: 6000 });

        // Mantiene el loader 100ms adicionales antes de mostrar la web.
        await delay(100);

        //layout.style.display = 'flex';

        requestAnimationFrame(() => layout.classList.add('fade-in'));

        loader.classList.add('fade-out');

        loader.addEventListener('transitionend', () => {
            loader.remove();
        }, { once: true });

    };

    runLoadingEffect().catch((error) => {
        console.error('Error en runLoadingEffect:', error);
    });

}
