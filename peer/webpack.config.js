const path = require('path');

module.exports = {
  entry: './src/index.ts',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'build'),
  },
  devServer: {
    // path: path.join(__dirname),
    // publicPath: './',
    // static: {
    //   directory: path.join(__dirname, 'public'),
    // },
    // contentBase: "./",
    watchFiles: ['src/**'],
    compress: true,
    port: 8080,
  },
};