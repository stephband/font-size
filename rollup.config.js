// rollup.config.js

import * as pkg from './package.json';
import visualizer from 'rollup-plugin-visualizer';

function getDateTime() {
    return (new Date())
    .toISOString()
    .slice(0, 16)
    .replace('T', ' ');
}

export default {
    treeshake: {
        // Assume reading a property of an object never has side-effects. Can
        // significantly reduce bundle size but will break functionality if
        // relying on getters or errors from illegal property access.
        propertyReadSideEffects: false,

        // Remove access to non-builtin global variables
        unknownGlobalSideEffects: false
    },

    input: {
        // Defines entry points
        // Inputs are split into chunks automatically by Rollup
        'module.rolled':        './module.js'
    },

    manualChunks: {
        // ManualChunks force chunks bundled from multiple files
        'modules/fn.rolled':      ['../fn/module.js'],
        'modules/dom.rolled':     ['../dom/module.js']
    },

    output: {
        dir: './',
        format: 'esm',
        exports: 'named',

        // Prevent chunks being given hashed extensions
        chunkFileNames: '[name].js',

        // A string to prepend to all chunks
        banner: '// ' + pkg.name + ' ' + pkg.version + ' (Built ' + getDateTime() + ')\n',
    },

    plugins: [visualizer({
        filename: './module.html',
        open:     true,
        template: 'sunburst',
        gzipSize: true
    })]
};
