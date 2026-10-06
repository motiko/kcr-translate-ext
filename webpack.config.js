const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const WebpackExtensionManifestPlugin = require("webpack-extension-manifest-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const inputDir = path.join(__dirname, "chrome");
const outputDir = path.join(__dirname, "dist");

module.exports = {
  mode: "production",
  entry: {
    autoplay: path.join(inputDir, "content", "autoplay.js"),
    index: path.join(inputDir, "content", "kindle"),
    bookLang: path.join(inputDir, "content", "bookLang.ts"),
    options: path.join(inputDir, "options"),
    background: path.join(inputDir, "background", "background.ts"),
    offscreen: path.join(inputDir, "offscreen", "offscreen.ts"),
  },
  output: {
    path: outputDir,
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)x?$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              ["@babel/preset-react", {"runtime": "automatic"}], // https://stackoverflow.com/questions/32070303/uncaught-referenceerror-react-is-not-defined
              "@babel/preset-typescript",
            ],
            plugins: [["@babel/plugin-transform-runtime"]],
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        type: "asset/resource",
        generator: {
          filename: "img/[name][ext]",
        },
      },
    ],
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new CleanWebpackPlugin(),
    new WebpackExtensionManifestPlugin({
      config: {
        base: path.join(inputDir, "manifest", "baseManifestV3.js"),
      },
      pkgJsonProps: ["version", "description"],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(inputDir, "img"),
          to: path.join(outputDir, "img"),
        },
        // add tesseract-related bundles
        {
          from: path.join(
            __dirname,
            "node_modules",
            "tesseract.js",
            "dist",
            "worker.min.js"
          ),
          to: path.join(outputDir, "lib", "tesseract"),
        },
        {
          from: path.join(
            __dirname,
            "node_modules",
            "tesseract.js-core",
            "tesseract-core.asm.js"
          ),
          to: path.join(outputDir, "lib", "tesseract"),
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: path.join(inputDir, "options", "options.html"),
      filename: "options.html",
      chunks: ["options"],
    }),
    new HtmlWebpackPlugin({
      template: path.join(inputDir, "offscreen", "offscreen.html"),
      filename: "offscreen.html",
      chunks: ["offscreen"],
    }),
  ],
  optimization: {
    minimizer: [
      new TerserPlugin({
        exclude: /\.asm.js$/,
      }),
    ],
  },
};
