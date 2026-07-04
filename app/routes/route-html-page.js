/*
    *  -----  /route-html-page.js  --  /src/routes/route-html-page.js  -----
*/

import { paths } from './paths.js';

const { favicon, layoutHeader, layoutNavbar, pages, pagesComponents, MarkdownShikiHtml, layoutFooter, styles, scripts, scssPages } = paths;

/** @type {import("../../types/index.js").Route} */
export const routeHtmlPage = {
    id: 'htmlPage',
    favicon: `${favicon}/html-icon.svg`,
    pageTitle: 'HTML5 — HyperText Markup Language',
    path: 'html-page',
    components: {
        "layoutHeader": `${layoutHeader}`,
        "layoutNavbar": `${layoutNavbar}`,
        "layoutMain": `${pages}/html/html-page.html`,
        "layoutFooter": `${layoutFooter}`,
    },
    pagesComponents: [
        { url: `${pagesComponents}/html/html-description.html`, target: '[data-component-page="htmlDescription"]' },
        { url: `${pagesComponents}/html/html-demo.html`, target: '[data-component-page="htmlDemo"]' },
    ],
    MarkdownShikiHtml: [

        {
            fileName: 'html-page-html.html',
            fileExtension: 'html',
            urlInput: `${pages}/html/html-page.html`,
            urlOutput: `${MarkdownShikiHtml}/pages/html`,
            target: '[data-shiki="codeHtml"]',
        },
        {
            fileName: 'html-page-css.html',
            fileExtension: 'css',
            urlInput: `${styles}/html-page.css`,
            urlOutput: `${MarkdownShikiHtml}/pages/html`,
            target: '[data-shiki="codeCss"]',
        },
        {
            fileName: 'html-page-scss.html',
            fileExtension: 'scss',
            urlInput: `${scssPages}/html-page.scss`,
            urlOutput: `${MarkdownShikiHtml}/pages/html`,
            target: '[data-shiki="codeScss"]',
        },
        {
            fileName: 'html-page.cjs-js.html',
            fileExtension: 'js',
            urlInput: `${scripts}/js/pages/html-page.cjs.js`,
            urlOutput: `${MarkdownShikiHtml}/pages/html`,
            target: '[data-shiki="codeCjsJs"]',
        },
        {
            fileName: 'html-page.esm-js.html',
            fileExtension: 'js',
            urlInput: `${scripts}/js/pages/html-page.esm.js`,
            urlOutput: `${MarkdownShikiHtml}/pages/html`,
            target: '[data-shiki="codeEsmJs"]',
        },
    ],
    headerTitle: 'HTML5 — HyperText Markup Language',
    styles: [
        { href: `${styles}/html-page.css` }
    ],
    scripts: [
        { src: `${scripts}/js/pages/html-page.cjs.js` },
        { src: `${scripts}/js/pages/html-page.esm.js`, isModule: true, exportFunctionName: 'mount' },
    ]
};
