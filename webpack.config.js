const path = require('path')
const webpack = require('webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin');
var StringReplacePlugin = require("string-replace-webpack-plugin");

module.exports = {
  entry: {
    // typescript: ['typescript'],
    background: './src/background',
    sentry: './src/sentry',
    github: './src/platforms/github',
    gitlab: './src/platforms/gitlab',
    bitbucket: './src/platforms/bitbucket',
  },
  output: {
    path: path.resolve('chrome/dist'),
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
      { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  },

  // https://github.com/postcss/postcss-js/issues/10#issuecomment-179782081
  node: { fs: 'empty' },
  plugins: [
    new CleanWebpackPlugin('chrome/dist'),
    new StringReplacePlugin()
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: "typescript",

    //   // filename: "vendor.js"
    //   // (Give the chunk a different name)

    //   minChunks: Infinity,
    //   // (with more entries, this ensures that no other module
    //   //  goes into the vendor chunk)
    // })
    // new webpack.optimize.AggressiveSplittingPlugin({
    //   // minSize: 10000,
    //   maxSize: 4 * 1024 * 1024,
    // })
  ]
}
