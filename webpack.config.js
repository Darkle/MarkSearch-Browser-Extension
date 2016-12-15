
const path = require('path')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
// const merge = require('webpack-merge')
const webpack = require('webpack')

// If I wanna minify, maybe use: https://babeljs.io/blog/2016/12/07/the-state-of-babel#minification
console.log(process.env.runBundleAnalyzer)
const paths = {
  srcBase: path.join(__dirname, 'src'),
  srcJS: path.join(__dirname, 'src', 'js'),
  srcJSContentScript: path.join(__dirname, 'src', 'js', 'contentScripts'),
  srcJSOptions: path.join(__dirname, 'src', 'js', 'options'),
  srcPug: path.join(__dirname, 'src', 'pug'),
  srcImages: path.join(__dirname, 'src', 'images'),
  srcFonts: path.join(__dirname, 'src', 'fonts'),
  srcStyles: path.join(__dirname, 'src', 'styles'),
  nonInlineStyles: path.join(__dirname, 'src', 'nonInlineStyles'),
  buildBase: path.join(__dirname, 'build'),
  buildJS: path.join(__dirname, 'build', 'js'),
  buildHTML: path.join(__dirname, 'build', 'html'),
  buildImages: path.join(__dirname, 'build', 'images'),
  buildFonts: path.join(__dirname, 'build', 'fonts'),
  buildStylesheets: path.join(__dirname, 'build', 'stylesheets'),
}

const webpackConfig = {
  devtool: 'source-map',
  target: 'web',
  entry: {
    background: path.join(paths.srcJS, 'background.js'),
    options: path.join(paths.srcJSOptions, 'options.js'),
    googleSearch_ContentScript: path.join(paths.srcJSContentScript, 'google', 'googleSearch_ContentScript.js'),
    duckduckgoSearch_ContentScript: path.join(paths.srcJSContentScript, 'duckduckgo', 'duckduckgoSearch_ContentScript.js'),
    sendPageData_ContentScript: path.join(paths.srcJSContentScript, 'sendPageData_ContentScript.js'),
    showNotification_ContentScript: path.join(paths.srcJSContentScript, 'showNotification_ContentScript.js'),
  },
  output: {
    path: paths.buildJS,
    filename: '[name].build.js',
    sourceMapFilename: '[file].map'
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'eslint-loader',
        include: [
          paths.srcJS
        ],
        exclude: /(node_modules)/,
      },
      {
        test: /\.pug$/,
        include: [
          paths.srcPug
        ],
        loader: 'pug-loader',
        options: {
          pretty: true
        }
      },
      {
        test: /\.styl$/,
        include: [
          paths.srcStyles
        ],
        loader: 'style-loader!css-loader?sourceMap!stylus-loader'
      },
      {
        test: /\.styl$/,
        include: [
          paths.nonInlineStyles
        ],
        loader: ExtractTextPlugin.extract({
          fallbackLoader: 'style-loader',
          loader: 'css-loader?sourceMap!stylus-loader'
        })
      },
      /*****
      * url-loader lets us load the opensans-regular.woff2 font file as a base64 data:application/font-woff2
      * url.
      */
      {
        test: /\.woff2$/,
        include: [
          paths.srcFonts
        ],
        loader: 'url-loader',
        options: {
          mimetype: 'application/font-woff2'
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.styl', '.sass', 'woff2']
  },
  plugins: [
    new ExtractTextPlugin({filename: '../stylesheets/[name].css'}),
    new CopyWebpackPlugin(
      [
        {
          from: path.join(paths.srcBase, 'manifest.json'),
          to: paths.buildBase
        }
      ],
      {
        copyUnmodified: true
      }
    ),
    new CopyWebpackPlugin(
      [
        {
          from: path.join(paths.srcImages, 'MSlargeIcon.png'),
          to: paths.buildImages
        }
      ]
    ),
    new HtmlWebpackPlugin({
      filename: path.resolve(paths.buildHTML, 'options.html'),
      template: path.join(paths.srcPug, 'options.pug'),
      chunks: [
        'options'
      ]
    }),
    // To remove the local file from moment cause they are huge!
    // https://github.com/moment/moment-timezone/issues/356#issuecomment-225258637
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
  ]
}

if(process.env.runBundleAnalyzer === 'true'){
  console.log('Running bundle analyser.')
  webpackConfig.plugins.push(new BundleAnalyzerPlugin())
  // merge.smart(webpackConfig, {plugins: [new BundleAnalyzerPlugin()]})
}

module.exports = webpackConfig
