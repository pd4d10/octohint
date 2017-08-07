const path = require('path')
const webpack = require('webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin');
var StringReplacePlugin = require("string-replace-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: {
    // For Chrome
    sentry: './src/sentry',
    'ts-lib': './src/ts-lib',
    background: './src/background',
    // 'github': './src/platforms/github',
    // 'gitlab': './src/platforms/gitlab',
    // 'bitbucket': './src/platforms/bitbucket',
    contentscript: './src/content',

    // For Safari
    // 'octohint.safariextension/dist/sentry': './src/sentry',
    // 'octohint.safariextension/dist/ts-lib': './src/ts-lib',
    // 'octohint.safariextension/dist/background': './src/background',
    // 'octohint.safariextension/dist/content': './src/content',

    // Options
    options: './src/options'
  },
  output: {
    path: path.resolve('./chrome/dist'),
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
    new CleanWebpackPlugin(['chrome/dist', 'octohint.safariextension/dist']),
    new StringReplacePlugin(),
    new HtmlWebpackPlugin({
      title: 'Options',
      filename: 'options.html',
      chunks: ['options'],
    }),
  ]
}
