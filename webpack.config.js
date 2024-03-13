//@ts-check

'use strict';

const path = require('path');

/**@type {import('webpack').Configuration}*/
const nodeConfig = {
    target: 'node',
    mode: 'none',
    entry: {
        extension: './src/main/extension.ts'
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, 'dist', 'main'),
        libraryTarget: 'commonjs',
        devtoolModuleFilenameTemplate: '../../[resource-path]'
    },
    devtool: 'nosources-source-map',
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader'
                    }
                ]
            }
        ]
    },
    externals: {
        'vscode': 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    }
};
/**@type {import('webpack').Configuration}*/
const browserConfig = {
    target: 'webworker',
    mode: 'none',
    entry: {
        extension: './src/browser/extension.ts'
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, 'dist', 'browser'),
        libraryTarget: 'commonjs',
        devtoolModuleFilenameTemplate: '../../[resource-path]'
    },
    devtool: 'nosources-source-map',
    resolve: {
        extensions: ['.ts', '.js'],
        fallback: {
            path: require.resolve('path-browserify')
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader'
                    }
                ]
            }
        ]
    },
    externals: {
        'vscode': 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    }
};
module.exports = [nodeConfig, browserConfig];