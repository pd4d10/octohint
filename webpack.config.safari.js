// @ts-check
const path = require('path')
const StringReplacePlugin = require('string-replace-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const config = require('./webpack.config')

// content script and background should split into different webpack config
// because namespace safari are conflict
const baseConfig = {
  ...config,
  output: {
    ...config.output,
    path: path.resolve('octohint.safariextension/dist'),
    publicPath: '',
  },
}

/** @type {import('webpack').Configuration} */
const contentScriptConfig = {
  ...baseConfig,
  entry: {
    'content-script': './src/safari/content-script',
  },
  plugins: [],
}

contentScriptConfig.module.rules[0].use.options.configFileName = './src/safari/content-script/tsconfig.json'

/** @type {import('webpack').Configuration} */
const backgroundConfig = {
  ...baseConfig,
  entry: {
    background: './src/safari/background',
  },
  plugins: [
    new StringReplacePlugin(),
    new HtmlWebpackPlugin({
      filename: 'global.html',
    }),
  ],
}

backgroundConfig.module.rules[0].use.options.configFileName = './src/safari/background/tsconfig.json'

module.exports = [contentScriptConfig, backgroundConfig]
