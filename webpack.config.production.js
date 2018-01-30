const webpack = require('webpack')
const merge = require('webpack-merge')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const config = require('./webpack.config')

// TODO Tree shaking
module.exports = merge(config, {
  devtool: false,
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new UglifyJsPlugin({
      uglifyOptions: {
        compress: {
          drop_console: true,
        },
        output: {
          // Fix Safari error:
          // SyntaxError: Invalid regular expression: missing terminating ] for character class
          ascii_only: process.env.TARGET === 'safari',
        },
      },
    }),
    new BundleAnalyzerPlugin(),
  ],
})
