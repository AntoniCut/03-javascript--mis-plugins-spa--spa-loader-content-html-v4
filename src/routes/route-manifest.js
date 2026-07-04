/*
    *  -------------------------------------------------------------------  *
    *  -----  /route-manifest.js  --  /src/routes/route-manifest.js  -----  *
    *  -------------------------------------------------------------------  *
*/


/** 
 * - `Manifiesto ligero de rutas: solo id, path y nombre de archivo (sin imports)`
 * - Se usa para lazy loading: el módulo de cada ruta se importa dinámicamente bajo demanda.
 * @type {import("../../types/index.js").RouteManifest[]} 
 */

export const routeManifest = [

    //  ----------  00 - Home  ----------
    { 
        id: 'home', 
        path: '', 
        file: 'route-00-home' 
    },

    //  ----------  Páginas de Contenido (HTML / CSS / JavaScript)  ----------
    {
        id: 'htmlPage',
        path: 'html-page',
        file: 'route-html-page'
    },

    {
        id: 'cssPage',
        path: 'css-page',
        file: 'route-css-page'
    },

    {
        id: 'javascriptPage',
        path: 'javascript-page',
        file: 'route-javascript-page'
    },

    {
        id: 'jqueryPage',
        path: 'jquery-page',
        file: 'route-jquery-page'
    },

    {
        id: 'jqueryUiPage',
        path: 'jquery-ui-page',
        file: 'route-jquery-ui-page'
    },

    //  ----------  Frameworks (React / Astro)  ----------
    {
        id: 'reactPage',
        path: 'react-page',
        file: 'route-react-page'
    },

    {
        id: 'astroPage',
        path: 'astro-page',
        file: 'route-astro-page'
    },

    //  ----------  404 - Not Found  ----------
    { 
        id: '404NotFoundPage', 
        path: '404-not-found-page', 
        file: 'route-404-not-found-page' 
    },

];
