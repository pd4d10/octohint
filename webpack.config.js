// @ts-check
const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: 'development',
  watch: true,
  entry: {
    background: './src/background',
    'content-script': './src/content-script',
    options: './src/options',
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
          loader: 'ts-loader',
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    fallback: {
      path: 'path-browserify',
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      filename: 'options.html',
      chunks: ['options'],
    }),
  ],
}
