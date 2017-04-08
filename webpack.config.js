module.exports = {
  entry: {
    github: './src/github',
    gitlab: './src/gitlab'
  },
  output: {
    path: './chrome',
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.ts', ".js"]
  },
}
