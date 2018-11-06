import * as webpack from 'webpack'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import * as UglifyJsPlugin from 'uglifyjs-webpack-plugin'
import configs from './webpack.config'

// TODO Tree shaking
const pConfigs: webpack.Configuration[] = configs.map((config, index) => ({
  ...config,
  mode: 'production' as webpack.Configuration['mode'],
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

export default pConfigs
