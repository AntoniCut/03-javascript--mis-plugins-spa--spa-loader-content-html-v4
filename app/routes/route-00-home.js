/*
    *  -----  /route-00-home.js  --  /src/routes/route-00-home.js  -----
*/

import { paths } from './paths.js';

const { favicon, layoutHeader, layoutNavbar, pages, pagesComponents, MarkdownShikiHtml, layoutFooter, styles, scripts, pluginsSource } = paths;

/** @type {import("../../types/index.js").Route} */
export const route00Home = {
    id: 'home',
    favicon: `${favicon}/javascript-favicon.ico`,
    pageTitle: 'spa-loader-content-html — Plugin SPA v4',
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
            urlInput: `${pluginsSource}/spa-loader-content-html/v4/spa-loader-content-html.js`,
            urlOutput: `${MarkdownShikiHtml}/plugins/v4`,
            target: '[data-shiki="plugins"]',
        },
    ],
    headerTitle: 'spa-loader-content-html — Plugin SPA v4',
    styles: [
        { href: `${styles}/home.css` }
    ],
    scripts: [
        { src: `${scripts}/js/pages/home.cjs.js` },
        { src: `${scripts}/js/pages/home.esm.js`, isModule: true },
    ]
};
