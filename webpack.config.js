module.exports = {
  entry: './src',
  output: {
    path: './chrome',
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      }
    ]
  }
}
