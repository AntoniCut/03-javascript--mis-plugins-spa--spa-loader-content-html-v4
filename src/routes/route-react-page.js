/*
    *  -----  /route-react-page.js  --  /src/routes/route-react-page.js  -----
*/

import { paths } from './paths.js';

const { favicon, layoutHeader, layoutNavbar, pages, pagesComponents, MarkdownShikiHtml, layoutFooter, styles, scripts, scssPages } = paths;

/** @type {import("../../types/index.js").Route} */
export const routeReactPage = {
    id: 'reactPage',
    favicon: `${favicon}/react-icon.svg`,
    pageTitle: 'React — Biblioteca UI Declarativa',
    path: 'react-page',
    components: {
        "layoutHeader": `${layoutHeader}`,
        "layoutNavbar": `${layoutNavbar}`,
        "layoutMain": `${pages}/react/react-page.html`,
        "layoutFooter": `${layoutFooter}`,
    },
    pagesComponents: [
        { url: `${pagesComponents}/react/react-description.html`, target: '[data-component-page="reactDescription"]' },
        { url: `${pagesComponents}/react/react-demo.html`, target: '[data-component-page="reactDemo"]' },
    ],
    MarkdownShikiHtml: [

        {
            fileName: 'react-page-html.html',
            fileExtension: 'html',
            urlInput: `${pages}/react/react-page.html`,
            urlOutput: `${MarkdownShikiHtml}/pages/react`,
            target: '[data-shiki="codeHtml"]',
        },
        {
            fileName: 'react-page-css.html',
            fileExtension: 'css',
            urlInput: `${styles}/react-page.css`,
            urlOutput: `${MarkdownShikiHtml}/pages/react`,
            target: '[data-shiki="codeCss"]',
        },
        {
            fileName: 'react-page-scss.html',
            fileExtension: 'scss',
            urlInput: `${scssPages}/react-page.scss`,
            urlOutput: `${MarkdownShikiHtml}/pages/react`,
            target: '[data-shiki="codeScss"]',
        },
        {
            fileName: 'react-page.cjs-js.html',
            fileExtension: 'js',
            urlInput: `${scripts}/js/pages/react-page.cjs.js`,
            urlOutput: `${MarkdownShikiHtml}/pages/react`,
            target: '[data-shiki="codeCjsJs"]',
        },
        {
            fileName: 'react-page.esm-js.html',
            fileExtension: 'js',
            urlInput: `${scripts}/js/pages/react-page.esm.js`,
            urlOutput: `${MarkdownShikiHtml}/pages/react`,
            target: '[data-shiki="codeEsmJs"]',
        },
    ],
    headerTitle: 'React — Biblioteca UI Declarativa',
    styles: [
        { href: `${styles}/react-page.css` }
    ],
    scripts: [
        { src: `${scripts}/js/pages/react-page.cjs.js` },
        { src: `${scripts}/js/pages/react-page.esm.js`, isModule: true },
    ]
};
