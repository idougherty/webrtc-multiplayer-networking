const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: [
    path.resolve(__dirname, 'public/index.html'),
    path.resolve(__dirname, 'src/index.ts'),
  ],
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'build'),
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.html/,
        type: 'asset/resource',
        generator: {
          filename: 'index.html'
        }
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new Dotenv()
  ],
  devServer: {
    watchFiles: ['src/**'],
    compress: false,
    port: 8080,
  },
};