/*
    *  ----------------------------------------------  *
    *  -----  /route-404-not-found-page.js  -----  *
    *  ----------------------------------------------  *
*/

import { paths } from './paths.js';

const { favicon, layoutHeader, layoutNavbar, pages, layoutFooter } = paths;

/** @type {import("../../types/index.js").Route} */
export const route404NotFoundPage = {
    id: '404NotFoundPage',
    favicon: `${favicon}/typescript-favicon.ico`,
    pageTitle: '404 - Página no encontrada',
    path: '404-not-found-page',
    components: {
        "layoutHeader": `${layoutHeader}`,
        "layoutNavbar": `${layoutNavbar}`,
        "layoutMain": `${pages}/404/404-not-found-page.html`,
        "layoutFooter": `${layoutFooter}`,
    },
    MarkdownShikiHtml: [],
    headerTitle: '404 - Página no encontrada',
    styles: [],
    scripts: []
};