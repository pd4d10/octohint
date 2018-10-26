const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const StringReplacePlugin = require('string-replace-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
// TODO: Live reload

const config = {
  mode: 'development',
  watch: true,
  entry: {
    background: './src/background',
    'content-script': './src/content-script',
    'ts-lib': './src/ts-lib',
    options: './src/options',
  },
  output: {
    path: path.resolve('chrome/dist'),
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
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      path: 'path-browserify',
    },
  },

  // https://github.com/postcss/postcss-js/issues/10#issuecomment-179782081
  node: { fs: 'empty' },
  plugins: [
    new CleanWebpackPlugin('chrome/dist'),
    new StringReplacePlugin(),
    new HtmlWebpackPlugin({
      title: 'Options',
      filename: 'options.html',
      chunks: ['options'],
    }),
  ],
}

// multiple outputs
// https://github.com/webpack/webpack/blob/master/examples/multi-compiler/webpack.config.js
module.exports = [
  config,
  {
    ...config,
    entry: {
      ...config.entry,
      background: './src/background/safari',
      'content-script': './src/content-script/safari',
    },
    output: {
      ...config.output,
      path: path.resolve('octohint.safariextension/dist'),
    },
    plugins: [new CleanWebpackPlugin('octohint.safariextension/dist'), ...config.plugins.slice(1)],
  },
]
