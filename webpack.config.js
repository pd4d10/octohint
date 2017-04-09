module.exports = {
  entry: {
    background: './src/background',
    github: './src/github',
    gitlab: './src/gitlab'
  },
  output: {
    path: './chrome',
    filename: '[name].js'
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
