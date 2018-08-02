const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const config = require('./webpack.config')

// TODO Tree shaking
module.exports = {
  ...config,
  mode: 'production',
  devtool: false,
  optimization: {
    noEmitOnErrors: false,
    minimizer: [
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
    ],
  },
  plugins: [...config.plugins, new BundleAnalyzerPlugin()],
}
