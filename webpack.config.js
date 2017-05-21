const path = require('path')
const webpack = require('webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin');
var StringReplacePlugin = require("string-replace-webpack-plugin");

// TODO:
const dest = `${process.env.SAFARI ? 'intelli-octo.safariextension' : 'chrome'}/dist`

module.exports = {
  entry: {
    'ts-lib': './src/ts-lib',
    background: './src/background',
    sentry: './src/sentry',
    github: './src/platforms/github',
    gitlab: './src/platforms/gitlab',
    bitbucket: './src/platforms/bitbucket',
  },
  output: {
    path: path.resolve(dest),
    filename: '[name].js'
  },
  // Enable sourcemaps for debugging webpack's output.
  devtool: "source-map",
  module: {
    rules: [
      {
        // This is an ugly hack to prevent require error
        test: /node_modules\/vscode.*\.js$/,
        loader: StringReplacePlugin.replace({
          replacements: [
            {
              pattern: /factory\(require, exports\)/g,
              replacement: function (match, p1, offset, string) {
                return 'factory(null, exports)'
              }
            },
            {
              pattern: /function \(require, exports\)/,
              replacement: function (match, p1, offset, string) {
                return 'function (UnUsedVar, exports)'
              }
            }
          ]
        })
      },
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader",
        exclude: /node_modules/,
      },
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  },

  // https://github.com/postcss/postcss-js/issues/10#issuecomment-179782081
  node: { fs: 'empty' },
  plugins: [
    new CleanWebpackPlugin(dest),
    new StringReplacePlugin()
  ]
}
