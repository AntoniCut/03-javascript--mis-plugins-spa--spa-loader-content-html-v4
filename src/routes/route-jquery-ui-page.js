/*
    *  -----  /route-jquery-ui-page.js  --  /src/routes/route-jquery-ui-page.js  -----
*/

import { paths } from './paths.js';

const { favicon, layoutHeader, layoutNavbar, pages, pagesComponents, MarkdownShikiHtml, layoutFooter, styles, scripts, scssPages } = paths;

/** @type {import("../../types/index.js").Route} */
export const routeJqueryUiPage = {
    id: 'jqueryUiPage',
    favicon: `${favicon}/jquery-ui-icon.svg`,
    pageTitle: 'jQuery UI — Interactions, Widgets & Effects',
    path: 'jquery-ui-page',
    components: {
        "layoutHeader": `${layoutHeader}`,
        "layoutNavbar": `${layoutNavbar}`,
        "layoutMain": `${pages}/jquery-ui/jquery-ui-page.html`,
        "layoutFooter": `${layoutFooter}`,
    },
    pagesComponents: [
        { url: `${pagesComponents}/jquery-ui/jquery-ui-description.html`, target: '[data-component-page="jqueryUiDescription"]' },
        { url: `${pagesComponents}/jquery-ui/jquery-ui-demo.html`, target: '[data-component-page="jqueryUiDemo"]' },
    ],
    MarkdownShikiHtml: [

        {
            fileName: 'jquery-ui-page-html.html',
            fileExtension: 'html',
            urlInput: `${pages}/jquery-ui/jquery-ui-page.html`,
            urlOutput: `${MarkdownShikiHtml}/pages/jquery-ui`,
            target: '[data-shiki="codeHtml"]',
        },
        {
            fileName: 'jquery-ui-page-css.html',
            fileExtension: 'css',
            urlInput: `${styles}/jquery-ui-page.css`,
            urlOutput: `${MarkdownShikiHtml}/pages/jquery-ui`,
            target: '[data-shiki="codeCss"]',
        },
        {
            fileName: 'jquery-ui-page-scss.html',
            fileExtension: 'scss',
            urlInput: `${scssPages}/jquery-ui-page.scss`,
            urlOutput: `${MarkdownShikiHtml}/pages/jquery-ui`,
            target: '[data-shiki="codeScss"]',
        },
        {
            fileName: 'jquery-ui-page.cjs-js.html',
            fileExtension: 'js',
            urlInput: `${scripts}/js/pages/jquery-ui-page.cjs.js`,
            urlOutput: `${MarkdownShikiHtml}/pages/jquery-ui`,
            target: '[data-shiki="codeCjsJs"]',
        },
        {
            fileName: 'jquery-ui-page.esm-js.html',
            fileExtension: 'js',
            urlInput: `${scripts}/js/pages/jquery-ui-page.esm.js`,
            urlOutput: `${MarkdownShikiHtml}/pages/jquery-ui`,
            target: '[data-shiki="codeEsmJs"]',
        },
    ],
    headerTitle: 'jQuery UI — Interactions, Widgets & Effects',
    styles: [
        { href: `${styles}/jquery-ui-page.css` }
    ],
    scripts: [
        { src: `${scripts}/js/pages/jquery-ui-page.cjs.js` },
        { src: `${scripts}/js/pages/jquery-ui-page.esm.js`, isModule: true },
    ]
};
