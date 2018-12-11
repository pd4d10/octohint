// @ts-check
const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const StringReplacePlugin = require('string-replace-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const config = require('./webpack.config')

/** @type {import('webpack').Configuration} */
const safariConfig = {
  ...config,
  entry: {
    background: './src/safari/background',
    'content-script': './src/safari/content-script',
  },
  output: {
    ...config.output,
    path: path.resolve('octohint.safariextension/dist'),
    publicPath: '',
  },
  plugins: [
    new CleanWebpackPlugin('octohint.safariextension/dist'),
    new StringReplacePlugin(),
    new HtmlWebpackPlugin({
      filename: 'global.html',
      chunks: ['background'],
    }),
  ],
}

module.exports = safariConfig
