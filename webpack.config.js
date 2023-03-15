/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
const path = require("path");

module.exports = [
  {
    entry: "./renderer.tsx",
    context: __dirname,
    target: "electron-renderer",
    mode: "production",
    optimization: {
      minimize: false,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    externals: [
      {
        "@k8slens/extensions": "var global.LensExtensions",
        "react": "var global.React",
        "react-dom": "var global.ReactDOM",
        "mobx": "var global.Mobx",
        "mobx-react": "var global.MobxReact",
      },
    ],
    resolve: {
      extensions: [ ".tsx", ".ts", ".js" ],
    },
    output: {
      libraryTarget: "commonjs2",
      globalObject: "this",
      filename: "renderer.js",
      path: path.resolve(__dirname, "dist"),
    },
    node: {
      __dirname: false,
    },
  },
];
