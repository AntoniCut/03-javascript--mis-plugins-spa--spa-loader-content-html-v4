/*
    *  -----  /route-jquery-page.js  --  /src/routes/route-jquery-page.js  -----
*/

import { paths } from './paths.js';

const { favicon, layoutHeader, layoutNavbar, pages, pagesComponents, MarkdownShikiHtml, layoutFooter, styles, scripts, scssPages } = paths;

/** @type {import("../../types/index.js").Route} */
export const routeJqueryPage = {
    id: 'jqueryPage',
    favicon: `${favicon}/jquery-icon.svg`,
    pageTitle: 'jQuery — The Write Less, Do More Library',
    path: 'jquery-page',
    components: {
        "layoutHeader": `${layoutHeader}`,
        "layoutNavbar": `${layoutNavbar}`,
        "layoutMain": `${pages}/jquery/jquery-page.html`,
        "layoutFooter": `${layoutFooter}`,
    },
    pagesComponents: [
        { url: `${pagesComponents}/jquery/jquery-description.html`, target: '[data-component-page="jqueryDescription"]' },
        { url: `${pagesComponents}/jquery/jquery-demo.html`, target: '[data-component-page="jqueryDemo"]' },
    ],
    MarkdownShikiHtml: [

        {
            fileName: 'jquery-page-html.html',
            fileExtension: 'html',
            urlInput: `${pages}/jquery/jquery-page.html`,
            urlOutput: `${MarkdownShikiHtml}/pages/jquery`,
            target: '[data-shiki="codeHtml"]',
        },
        {
            fileName: 'jquery-page-css.html',
            fileExtension: 'css',
            urlInput: `${styles}/jquery-page.css`,
            urlOutput: `${MarkdownShikiHtml}/pages/jquery`,
            target: '[data-shiki="codeCss"]',
        },
        {
            fileName: 'jquery-page-scss.html',
            fileExtension: 'scss',
            urlInput: `${scssPages}/jquery-page.scss`,
            urlOutput: `${MarkdownShikiHtml}/pages/jquery`,
            target: '[data-shiki="codeScss"]',
        },
        {
            fileName: 'jquery-page.cjs-js.html',
            fileExtension: 'js',
            urlInput: `${scripts}/js/pages/jquery-page.cjs.js`,
            urlOutput: `${MarkdownShikiHtml}/pages/jquery`,
            target: '[data-shiki="codeCjsJs"]',
        },
        {
            fileName: 'jquery-page.esm-js.html',
            fileExtension: 'js',
            urlInput: `${scripts}/js/pages/jquery-page.esm.js`,
            urlOutput: `${MarkdownShikiHtml}/pages/jquery`,
            target: '[data-shiki="codeEsmJs"]',
        },
    ],
    headerTitle: 'jQuery — The Write Less, Do More Library',
    styles: [
        { href: `${styles}/jquery-page.css` }
    ],
    scripts: [
        { src: `${scripts}/js/pages/jquery-page.cjs.js` },
        { src: `${scripts}/js/pages/jquery-page.esm.js`, isModule: true },
    ]
};
