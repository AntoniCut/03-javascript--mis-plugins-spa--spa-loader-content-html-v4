/*
    *  ------------------------------------------  *
    *  -----  /spa.js  --  /src/spa/spa.js  -----  *
    *  ------------------------------------------  *
*/


import { routeManifest } from '../routes/route-manifest.js';
import { spaLoaderContentHtml } from '../plugins/spa-loader-content-html/v4/spa-loader-content-html.js';


/** @type {string} - `Base del proyecto` */
const base = '/mis-plugins-spa/spa-loader-content-html-v4';


/**  
 * ---------------------
 * -----  `spa()`  -----
 * ---------------------
 * - Función principal que `inicializa la SPA`.
 * - Utilizando el plugin spa-loader-content-html.js con un manifiesto de rutas para lazy loading.
 */

export const spa = () => {

    
    //  ----------  Documento Cargado  ----------
    console.log('\n');
    console.warn('-----  spa.js - Cargado  -----');
    console.log('\n');
       
    
    //  ----------  Opciones que le pasamos al plugin (lazy loading con manifest)  ----------
    
    /** @type {import("../../types/index.js").ConfigOptionsSPA} - `-----  Configuración para el plugin spa-loader-content-html.js  -----` */
    
    const configOptionsSpa = {
        routeManifest,
        routeModulesBase: `${base}/app/routes`,
        base,
    }


    //  ----------  Invocamos el Plugins  --  spa-loader-content-html.js  ----------
    spaLoaderContentHtml(configOptionsSpa);

}
