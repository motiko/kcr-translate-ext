const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackExtensionManifestPlugin = require('webpack-extension-manifest-plugin');

const inputDir = path.join(__dirname, 'chrome');
const outputDir = path.join(__dirname, 'dist');

module.exports = {
  entry: {
    autoplay: path.join(inputDir, 'autoplay.js'),
    index: path.join(inputDir, 'index.js'),
    ocr: path.join(inputDir, 'ocr.js'),
    options: path.join(inputDir, 'options.js'),
    background: path.join(inputDir, 'background.js'),
  },
  output: {
    path: outputDir,
    filename: "[name].js"
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        type: 'asset/resource',
        generator: {
          filename: 'img/[name][ext]',
        },
      }
    ],
  },
  resolve: {
    extensions: ['.js'],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new WebpackExtensionManifestPlugin({
      config: {
        base: path.join(inputDir, 'baseManifestV2.js'),
      },
      pkgJsonProps: [
        'version',
        'description',
      ]
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(inputDir, 'img'),
          to: path.join(outputDir, "img"),
        },
        // add tesseract-related bundles
        {
          from: path.join(__dirname, 'node_modules', 'tesseract.js', 'dist', 'worker.min.js'),
          to: path.join(outputDir, "lib", 'tesseract'),
        },
        {
          from: path.join(__dirname, 'node_modules', 'tesseract.js-core', 'tesseract-core.wasm.js'),
          to: path.join(outputDir, "lib", 'tesseract'),
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: path.join(inputDir, "ocr.html"),
      filename: "ocr.html",
      chunks: ["ocr"]
    }),
    new HtmlWebpackPlugin({
      template: path.join(inputDir, "options.html"),
      filename: "options.html",
      chunks: ["options"]
    }),
    new HtmlWebpackPlugin({
      template: path.join(inputDir, "background.html"),
      filename: "background.html",
      chunks: ["background"]
    }),
  ],
};
