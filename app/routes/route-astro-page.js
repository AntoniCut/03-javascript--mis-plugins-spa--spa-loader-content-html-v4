/*
    *  -----------------------------------------------------------------------  *
    *  -----  /route-astro-page.js  --  /src/routes/route-astro-page.js  -----  *
    *  -----------------------------------------------------------------------  *
*/

import { paths } from './paths.js';

const { favicon, layoutHeader, layoutNavbar, pages, pagesComponents, MarkdownShikiHtml, layoutFooter, styles, scripts, scssPages } = paths;

/** @type {import("../../types/index.js").Route} */
export const routeAstroPage = {
    id: 'astroPage',
    favicon: `${favicon}/astro-official.svg`,
    pageTitle: 'Astro — Framework de Sitios Estáticos',
    path: 'astro-page',
    components: {
        "layoutHeader": `${layoutHeader}`,
        "layoutNavbar": `${layoutNavbar}`,
        "layoutMain": `${pages}/astro/astro-page.html`,
        "layoutFooter": `${layoutFooter}`,
    },
    pagesComponents: [
        { url: `${pagesComponents}/astro/astro-description.html`, target: '[data-component-page="astroDescription"]' },
        { url: `${pagesComponents}/astro/astro-demo.html`, target: '[data-component-page="astroDemo"]' },
    ],
    MarkdownShikiHtml: [

        {
            fileName: 'astro-page-html.html',
            fileExtension: 'html',
            urlInput: `${pages}/astro/astro-page.html`,
            urlOutput: `${MarkdownShikiHtml}/pages/astro`,
            target: '[data-shiki="codeHtml"]',
        },
        {
            fileName: 'astro-page-css.html',
            fileExtension: 'css',
            urlInput: `${styles}/astro-page.css`,
            urlOutput: `${MarkdownShikiHtml}/pages/astro`,
            target: '[data-shiki="codeCss"]',
        },
        {
            fileName: 'astro-page-scss.html',
            fileExtension: 'scss',
            urlInput: `${scssPages}/astro-page.scss`,
            urlOutput: `${MarkdownShikiHtml}/pages/astro`,
            target: '[data-shiki="codeScss"]',
        },
        {
            fileName: 'astro-page.cjs-js.html',
            fileExtension: 'js',
            urlInput: `${scripts}/js/pages/astro-page.cjs.js`,
            urlOutput: `${MarkdownShikiHtml}/pages/astro`,
            target: '[data-shiki="codeCjsJs"]',
        },
        {
            fileName: 'astro-page.esm-js.html',
            fileExtension: 'js',
            urlInput: `${scripts}/js/pages/astro-page.esm.js`,
            urlOutput: `${MarkdownShikiHtml}/pages/astro`,
            target: '[data-shiki="codeEsmJs"]',
        },
    ],
    headerTitle: 'Astro — Framework de Sitios Estáticos',
    styles: [
        { href: `${styles}/astro-page.css` }
    ],
    scripts: [
        { src: `${scripts}/js/pages/astro-page.cjs.js` },
        { src: `${scripts}/js/pages/astro-page.esm.js`, isModule: true },
    ]
};
