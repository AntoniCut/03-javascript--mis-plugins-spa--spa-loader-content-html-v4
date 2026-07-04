/*
    *  -----  /route-javascript-page.js  --  /src/routes/route-javascript-page.js  -----
*/

import { paths } from './paths.js';

const { favicon, layoutHeader, layoutNavbar, pages, pagesComponents, MarkdownShikiHtml, layoutFooter, styles, scripts, scssPages } = paths;

/** @type {import("../../types/index.js").Route} */
export const routeJavascriptPage = {
    id: 'javascriptPage',
    favicon: `${favicon}/javascript-icon.svg`,
    pageTitle: 'JavaScript ES6+ — El Lenguaje de la Web',
    path: 'javascript-page',
    components: {
        "layoutHeader": `${layoutHeader}`,
        "layoutNavbar": `${layoutNavbar}`,
        "layoutMain": `${pages}/javascript/javascript-page.html`,
        "layoutFooter": `${layoutFooter}`,
    },
    pagesComponents: [
        { url: `${pagesComponents}/javascript/javascript-description.html`, target: '[data-component-page="javascriptDescription"]' },
        { url: `${pagesComponents}/javascript/javascript-demo.html`, target: '[data-component-page="javascriptDemo"]' },
    ],
    MarkdownShikiHtml: [

        {
            fileName: 'javascript-page-html.html',
            fileExtension: 'html',
            urlInput: `${pages}/javascript/javascript-page.html`,
            urlOutput: `${MarkdownShikiHtml}/pages/javascript`,
            target: '[data-shiki="codeHtml"]',
        },
        {
            fileName: 'javascript-page-css.html',
            fileExtension: 'css',
            urlInput: `${styles}/javascript-page.css`,
            urlOutput: `${MarkdownShikiHtml}/pages/javascript`,
            target: '[data-shiki="codeCss"]',
        },
        {
            fileName: 'javascript-page-scss.html',
            fileExtension: 'scss',
            urlInput: `${scssPages}/javascript-page.scss`,
            urlOutput: `${MarkdownShikiHtml}/pages/javascript`,
            target: '[data-shiki="codeScss"]',
        },
        {
            fileName: 'javascript-page.cjs-js.html',
            fileExtension: 'js',
            urlInput: `${scripts}/js/pages/javascript-page.cjs.js`,
            urlOutput: `${MarkdownShikiHtml}/pages/javascript`,
            target: '[data-shiki="codeCjsJs"]',
        },
        {
            fileName: 'javascript-page.esm-js.html',
            fileExtension: 'js',
            urlInput: `${scripts}/js/pages/javascript-page.esm.js`,
            urlOutput: `${MarkdownShikiHtml}/pages/javascript`,
            target: '[data-shiki="codeEsmJs"]',
        },
    ],
    headerTitle: 'JavaScript ES6+ — El Lenguaje de la Web',
    styles: [
        { href: `${styles}/javascript-page.css` }
    ],
    scripts: [
        { src: `${scripts}/js/pages/javascript-page.cjs.js` },
        { src: `${scripts}/js/pages/javascript-page.esm.js`, isModule: true },
    ]
};
