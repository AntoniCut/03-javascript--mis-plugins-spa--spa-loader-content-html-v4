/*
    *  ----------------------------------------------------------------------------------  *
    *  -----  /config-options-spa-types.js  --  /types/config-options-spa-types.js  -----  *
    *  ----------------------------------------------------------------------------------  *
*/

/** @typedef {import('./route-manifest.js').RouteManifest} RouteManifest */


//  ----------  Esto asegura que VS Code lo trate como módulo  ----------
export {}; 


/**
 * --------------------------------
 * -----  `ConfigOptionsSPA`  -----
 * --------------------------------
 * @typedef {Object} ConfigOptionsSPA - Objeto que define la configuracion que le pasamos al plugin `spaLoaderContentHtml`
 * @property {RouteManifest[]} [routeManifest] - Manifiesto ligero de rutas para lazy loading.
 * @property {string} [routeModulesBase] - Ruta base para importar dinamicamente los modulos de ruta.
 * @property {string} base - Ruta base de la aplicación (se deja vacía si no se usa `history.pushState` o hash routing).
 */
