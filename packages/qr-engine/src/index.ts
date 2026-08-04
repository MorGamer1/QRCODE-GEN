/**
 * Isomorphic entry point - safe to import from the browser (used for the
 * live design preview in the web app) as well as the server. No Node-only
 * dependencies (sharp/pdfkit) are reachable from this file; those live
 * behind the `@qrgen/qr-engine/server` subpath export.
 */
export * from './matrix';
export * from './geometry';
export * from './scene';
export * from './svg';
