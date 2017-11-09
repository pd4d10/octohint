const path = require('path')
const webpack = require('webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const StringReplacePlugin = require('string-replace-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
// const ChromeExtensionReloader  = require('webpack-chrome-extension-reloader');

// plugins: [
//     new ChromeExtensionReloader() // ONLY USE IT IN DEVELOPMENT BUILD!
// ]

const isSafari = process.env.TARGET === 'safari'

module.exports = {
  entry: {
    background: isSafari ? './src/background/safari' : './src/background',
    sentry: './src/sentry',
    'content-script': isSafari ? './src/content-script/safari' : './src/content-script',
    'ts-lib': './src/ts-lib',
    options: './src/options',
  },
  output: {
    path: path.resolve(isSafari ? 'octohint.safariextension/dist' : 'chrome/dist'),
    filename: '[name].js',
  },
  // Enable sourcemaps for debugging webpack's output.
  devtool: 'source-map',
  module: {
    rules: [
      {
        // This is an ugly hack to prevent require error
        test: /node_modules\/vscode.*\.js$/,
        loader: StringReplacePlugin.replace({
          replacements: [
            {
              pattern: /factory\(require, exports\)/g,
              replacement: function(match, p1, offset, string) {
                return 'factory(null, exports)'
              },
            },
            {
              pattern: /function \(require, exports\)/,
              replacement: function(match, p1, offset, string) {
                return 'function (UnUsedVar, exports)'
              },
            },
          ],
        }),
      },
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader',
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },

  // https://github.com/postcss/postcss-js/issues/10#issuecomment-179782081
  node: { fs: 'empty' },
  plugins: [
    new CleanWebpackPlugin(isSafari ? 'octohint.safariextension/dist' : 'chrome/dist'),
    new StringReplacePlugin(),
    new HtmlWebpackPlugin({
      title: 'Options',
      filename: 'options.html',
      chunks: ['options'],
    }),
  ],
}
