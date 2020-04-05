// @ts-check
const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const StringReplacePlugin = require('string-replace-webpack-plugin')

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: 'development',
  watch: true,
  entry: {
    background: './src/chrome/background',
    'content-script': './src/chrome/content-script',
  },
  output: {
    path: path.resolve('chrome/dist'),
    filename: '[name].js',
    publicPath: '/dist/',
  },
  // Enable sourcemaps for debugging webpack's output.
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'awesome-typescript-loader',
        },
        exclude: /node_modules/,
      },
      {
        // This is an ugly hack to prevent require error
        test: /node_modules\/vscode.*\.js$/,
        use: StringReplacePlugin.replace({
          replacements: [
            {
              pattern: /factory\(require, exports\)/g,
              replacement: function (match, p1, offset, string) {
                return 'factory(null, exports)'
              },
            },
            {
              pattern: /function \(require, exports\)/,
              replacement: function (match, p1, offset, string) {
                return 'function (UnUsedVar, exports)'
              },
            },
          ],
        }),
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        use: 'source-map-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.svelte$/,
        exclude: /node_modules/,
        use: 'svelte-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.mjs', '.svelte'],
  },
  node: {
    fs: 'empty', // fix vscode-nls build
  },
  plugins: [
    new CleanWebpackPlugin({ cleanOnceBeforeBuildPatterns: ['chrome/dist'] }),
    new StringReplacePlugin(),
  ],
}
