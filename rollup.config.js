
// - Imports - //

import dts from 'rollup-plugin-dts';
import del from 'rollup-plugin-delete';
import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser'; // See terser options here: https://github.com/terser/terser#minify-options


// - Config - //

// // Mode.
// const devMode = (process.env.NODE_ENV === 'development');
// console.log(`${ devMode ? 'development' : 'production' } mode bundle`);

export default [


    // - Declarations (+ delete dts folder) - //

    {
        input: 'dist/dts/index.d.ts',
        output: {
          file: 'dist/ContextMan.d.ts',
          format: 'es',
        },
        plugins: [
            dts(),
            del({ targets: 'dist/dts*', hook: 'buildEnd' }),
        ],
    },


    // - ES Module - //

    {
        input: 'dist/index.js',
        output: {
            file: 'dist/ContextMan.mjs',
            format: 'es',
        },
        plugins: [
            terser({
                ecma: 2015,
                // sourceMap: true,
                compress: {
                    module: true,
                    toplevel: true,
                    unsafe_arrows: true,
                    drop_debugger: true
                    // drop_console: !devMode,
                    // drop_debugger: !devMode
                },
                output: { quote_style: 1 }
            }),
        ],
    },


    // - CJS - //

    {
        input: 'dist/index.js',
        output: {
            file: 'dist/ContextMan.js',
            format: 'cjs',
            exports: "auto"
        },
        plugins: [
            terser({
                ecma: 2015,
                // sourceMap: true,
                compress: {
                    // toplevel: true,
                    module: true,
                    unsafe_arrows: true,
                    drop_debugger: true
                    // drop_console: !devMode,
                    // drop_debugger: !devMode
                },
                output: { quote_style: 1 }
            }),
        ],
    },


    // - Copy & delete - //

    // Copy for direct es module use (cannot use .mjs, instead the d.ts and .js must have same path).
    {
        input: 'dist/ContextMan.mjs',
        plugins: [
            copy({ targets: [ { src: 'dist/ContextMan.d.ts', dest: 'dist', rename: 'ContextMan.module.d.ts' } ] }),
            copy({ targets: [ { src: 'dist/ContextMan.mjs', dest: 'dist', rename: 'ContextMan.module.js' } ] }),
            del({ targets: ['dist/classes*', 'dist/index.js', 'dist/types.js'], hook: 'buildEnd' })
        ]
    },

];
