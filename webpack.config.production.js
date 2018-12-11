// @ts-check
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const TerserPlugin = require('terser-webpack-plugin')
const config = require('./webpack.config')
const safariConfigs = require('./webpack.config.safari')

// multiple outputs
// https://github.com/webpack/webpack/blob/master/examples/multi-compiler/webpack.config.js

/** @type {import('webpack').Configuration[]} */
const pConfigs = [config, ...safariConfigs].map((config, index) => ({
  ...config,
  mode: 'production',
  devtool: false,
  optimization: {
    noEmitOnErrors: false,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
          output: {
            // Fix Safari error:
            // SyntaxError: Invalid regular expression: missing terminating ] for character class
            ascii_only: true,
          },
        },
      }),
    ],
  },
  plugins: [
    ...config.plugins,
    new BundleAnalyzerPlugin({
      analyzerPort: 8888 + index,
    }),
  ],
}))

module.exports = pConfigs
