/*
    *  --------------------------------------------  *
    *  -----  /dom.d.ts  --  /types/dom.d.ts  -----  *
    *  --------------------------------------------  *
*/


/// <reference lib="dom" />
/// <reference lib="es2022" />


interface HTMLHeaderElement extends HTMLElement {}
interface HTMLFooterElement extends HTMLElement {}
interface HTMLMainElement extends HTMLElement {}
interface HTMLNavElement extends HTMLElement {}
interface HTMLSectionElement extends HTMLElement {}
interface HTMLArticleElement extends HTMLElement {}
interface HTMLAsideElement extends HTMLElement {}
interface HTMLFigureElement extends HTMLElement {}
interface HTMLFigcaptionElement extends HTMLElement {}
interface HTMLStrongElement extends HTMLElement {}
interface HTMLButtonElement extends HTMLElement {}


interface ViewTransition {
    readonly finished: Promise<void>;
    readonly ready: Promise<void>;
    readonly updateCallbackDone: Promise<void>;
    skipTransition(): void;
}

interface Document {
    startViewTransition(callback: () => void | Promise<void>): ViewTransition;
}
