/*
    *  -----  /route-00-home.js  --  /src/routes/route-00-home.js  -----
*/

import { paths } from './paths.js';

const { favicon, layoutHeader, layoutNavbar, pages, pagesComponents, MarkdownShikiHtml, layoutFooter, styles, scripts, pluginsSource } = paths;

/** @type {import("../../types/index.js").Route} */
export const route00Home = {
    id: 'home',
    favicon: `${favicon}/javascript-favicon.ico`,
    pageTitle: 'jquery.spa-with-method-load-from-jquery-v5 — Plugin SPA v5',
    path: '',
    components: {
        "layoutHeader": `${layoutHeader}`,
        "layoutNavbar": `${layoutNavbar}`,
        "layoutMain": `${pages}/home.html`,
        "layoutFooter": `${layoutFooter}`,
    },
    pagesComponents: [
        { url: `${pagesComponents}/home-description.html`, target: '[data-component-page="homeDescription"]' },
        { url: `${pagesComponents}/home-demo.html`, target: '[data-component-page="homeDemo"]' },
    ],
    MarkdownShikiHtml: [
        {
            fileName: 'spa-loader-content-html-js.html',
            fileExtension: 'js',
            urlInput: `${pluginsSource}/spa-loader-content-html/v5/spa-loader-content-html.js`,
            urlOutput: `${MarkdownShikiHtml}/plugins/v4`,
            target: '[data-shiki="plugins"]',
        },
    ],
    headerTitle: 'jquery.spa-with-method-load-from-jquery-v5 — Plugin SPA v5',
    styles: [
        { href: `${styles}/home.css` }
    ],
    scripts: [
        { src: `${scripts}/pages/home.cjs.js` },
        { src: `${scripts}/pages/home.esm.js`, isModule: true },
    ]
};
