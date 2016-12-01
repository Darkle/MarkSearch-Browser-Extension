/****
* If want to set up seperate file for css - http://bit.ly/2crZxRP & http://bit.ly/2dPjoLi
* Setting up autoprefixer - http://bit.ly/2crZEgn
* Adding global scripts like jquery: http://bit.ly/2cLBCgv - and/or vendor/commons - http://bit.ly/2cLKJOj & http://bit.ly/2cLKG51
* Splitting webpack config - http://survivejs.com/webpack/developing-with-webpack/splitting-configuration/
* Can strip console statements out with drop_console: true - http://bit.ly/2cq6PbI
* Eliminating unused CSS - http://bit.ly/2cq9J04
* Using stylus css frameworks - http://bit.ly/2cqcdvd
* Fonts - http://survivejs.com/webpack/loading-assets/loading-fonts/
* If want to seperate sections into own config files, can use webpack-merge - http://bit.ly/2dPbK3x http://bit.ly/2dPchmh
* Setting up dev server: http://bit.ly/2d7yNcx
*/

const path = require('path')

const bell = require('bell-on-bundler-error-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
// const webpack = require('webpack')
// const WebpackCleanupPlugin = require('webpack-cleanup-plugin')
// const WriteJsonPlugin = require('write-json-webpack-plugin')
// const webpackLoadPlugins = require('webpack-load-plugins')
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin


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

/*****
* googleSearch_ContentScript needs to be an array because of this: https://github.com/webpack/webpack/issues/300
*/
module.exports = {
  entry: {
    background: path.join(paths.srcJS, 'background.js'),
    options: path.join(paths.srcJSOptions, 'options.js'),
    googleSearch_ContentScript: [path.join(paths.srcJSContentScript, 'google', 'googleSearch_ContentScript.js')],
    bingSearch_ContentScript: path.join(paths.srcJSContentScript, 'bing', 'bingSearch_ContentScript.js'),
    baiduSearch_ContentScript: path.join(paths.srcJSContentScript, 'baidu', 'baiduSearch_ContentScript.js'),
    duckduckgoSearch_ContentScript: path.join(paths.srcJSContentScript, 'duckduckgo', 'duckduckgoSearch_ContentScript.js'),
    sendPageData_ContentScript: path.join(paths.srcJSContentScript, 'sendPageData_ContentScript.js'),
    showNotification_ContentScript: path.join(paths.srcJSContentScript, 'showNotification_ContentScript.js'),
    // vendor: [
    //   'jquery',
    // ]
  },
  devtool: 'source-map',
  output: {
    path: paths.buildJS,
    filename: '[name].build.js',
    sourceMapFilename: '[file].map'
  },
  module: {
    preLoaders: [
      {
        test: /\.js$/,
        loader: 'eslint-loader',
        include: [
          paths.srcJS
        ],
      }
    ],
    loaders: [
      /*****
      * The json loader is becuase of lodash.trim etc. library and this: http://bit.ly/2eftCF4
      */
      // {
      //   test: /\.json$/,
      //   loader: 'json-loader',
      //   include: [
      //     /node_modules/
      //   ],
      //   ignore: path.join(paths.srcBase, 'manifest.json')
      // },
      {
        test: /\.js$/,
        include: [
          paths.srcJS
        ],
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.pug$/,
        include: [
          paths.srcPug
        ],
        loader: 'pug-loader',
        query: {
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
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader?sourceMap!stylus-loader')
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
        query: {
          mimetype: 'application/font-woff2'
        }
      }
    ]
  },
  /*****
  * The empty string first is needed for resolve.extensions
  */
  resolve: {
    extensions: ['', '.js', '.styl', '.sass', 'woff2']
  },
  plugins: [
    new ExtractTextPlugin('../stylesheets/[name].css'),
    // new WebpackCleanupPlugin(),

    // new WriteJsonPlugin({
    //   object: manifestObject,
    //   path: paths.build,
    //   filename: 'manifest.json'
    // }),

    // new BundleAnalyzerPlugin(),

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
    /****
    * Need to set up $/jquery as a global
    */
    // new webpack.ProvidePlugin({
    //   $: 'jquery',
    //   jQuery: 'jquery',
    //   'window.jQuery': 'jquery',
    // }),

    /****
    * We dont want to use the CommonsChunkPlugin as that would seperate out the webpack bootstrap code which
    * would include the instructions to load all the js (vendor, popup and options), which we dont want, cause
    * we dont want the popup page to be loading the options js too.
    *
    * CommonsChunkPlugin puts common code in to one file - (the webpack bootstrap code is an example
    * of code that is used more than once).
    * https://webpack.github.io/docs/list-of-plugins.html#commonschunkplugin
    * We are also splitting the code into vendor and application as shown here: https://webpack.github.io/docs/list-of-plugins.html#2-explicit-vendor-chunk
    * & here: https://www.youtube.com/watch?v=IQ0i_O749Gg
    */
    // new webpack.optimize.CommonsChunkPlugin({
    //   /****
    //   * name is the chunk name(s) of the file CommonsChunkPlugin produces
    //   */
    //   names: ['vendor', 'webpackBootstrap']
    // }),

    // new ExtractTextPlugin('[name].[chunkhash].css'),

    // https://github.com/ampedandwired/html-webpack-plugin#configuration
    // new HtmlWebpackPlugin({
    //   filename: 'popup.html',
    //   template: path.join(paths.srcPug, 'popup.pug'),
    //   // inject: false,
    //   // showErrors: false,
    //   // hash: true,
    //   chunks: [
    //     'vendor',
    //     'popup'
    //   ]
    // }),
    new HtmlWebpackPlugin({
      filename: path.resolve(paths.buildHTML, 'options.html'),
      template: path.join(paths.srcPug, 'options.pug'),
      // inject: false,
      // showErrors: false,
      // hash: true,
      chunks: [
        // 'vendor',
        'options'
      ]
    }),
    // new webpack.optimize.UglifyJsPlugin({
    //   compress: {
    //     warnings: false,
    //   },
    //   output: {
    //     comments: false,
    //   },
    //   mangle: {
    //     // http://survivejs.com/webpack/building-with-webpack/minifying-build/
    //     except: ['webpackJsonp','$']
    //   }
    // }),
    new bell()
  ]
}
