/*
    *  -----  /route-css-page.js  --  /src/routes/route-css-page.js  -----
*/

import { paths } from './paths.js';

const { favicon, layoutHeader, layoutNavbar, pages, pagesComponents, MarkdownShikiHtml, layoutFooter, styles, scripts, scssPages } = paths;

/** @type {import("../../types/index.js").Route} */
export const routeCssPage = {
    id: 'cssPage',
    favicon: `${favicon}/css-icon.svg`,
    pageTitle: 'CSS3 — Cascading Style Sheets',
    path: 'css-page',
    components: {
        "layoutHeader": `${layoutHeader}`,
        "layoutNavbar": `${layoutNavbar}`,
        "layoutMain": `${pages}/css/css-page.html`,
        "layoutFooter": `${layoutFooter}`,
    },
    pagesComponents: [
        { url: `${pagesComponents}/css/css-description.html`, target: '[data-component-page="cssDescription"]' },
        { url: `${pagesComponents}/css/css-demo.html`, target: '[data-component-page="cssDemo"]' },
    ],
    MarkdownShikiHtml: [

        {
            fileName: 'css-page-html.html',
            fileExtension: 'html',
            urlInput: `${pages}/css/css-page.html`,
            urlOutput: `${MarkdownShikiHtml}/pages/css`,
            target: '[data-shiki="codeHtml"]',
        },
        {
            fileName: 'css-page-css.html',
            fileExtension: 'css',
            urlInput: `${styles}/css-page.css`,
            urlOutput: `${MarkdownShikiHtml}/pages/css`,
            target: '[data-shiki="codeCss"]',
        },
        {
            fileName: 'css-page-scss.html',
            fileExtension: 'scss',
            urlInput: `${scssPages}/css-page.scss`,
            urlOutput: `${MarkdownShikiHtml}/pages/css`,
            target: '[data-shiki="codeScss"]',
        },
        {
            fileName: 'css-page.cjs-js.html',
            fileExtension: 'js',
            urlInput: `${scripts}/js/pages/css-page.cjs.js`,
            urlOutput: `${MarkdownShikiHtml}/pages/css`,
            target: '[data-shiki="codeCjsJs"]',
        },
        {
            fileName: 'css-page.esm-js.html',
            fileExtension: 'js',
            urlInput: `${scripts}/js/pages/css-page.esm.js`,
            urlOutput: `${MarkdownShikiHtml}/pages/css`,
            target: '[data-shiki="codeEsmJs"]',
        },
    ],
    headerTitle: 'CSS3 — Cascading Style Sheets',
    styles: [
        { href: `${styles}/css-page.css` }
    ],
    scripts: [
        { src: `${scripts}/js/pages/css-page.cjs.js` },
        { src: `${scripts}/js/pages/css-page.esm.js`, isModule: true, exportFunctionName: 'mount' },
    ]
};
