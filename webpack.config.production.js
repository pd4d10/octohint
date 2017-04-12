const webpack = require('webpack')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const config = require('./webpack.config')

// TODO Tree shaking

config.devtool = false

config.plugins = config.plugins.concat([
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify('production')
  }),
  new webpack.optimize.UglifyJsPlugin(),
  new BundleAnalyzerPlugin()
])

module.exports = config
