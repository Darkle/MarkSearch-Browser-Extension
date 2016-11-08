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

// const fsExtra = require('fs-extra')

const webpack = require('webpack')
const bell = require('bell-on-bundler-error-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
// const WebpackCleanupPlugin = require('webpack-cleanup-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
// const WriteJsonPlugin = require('write-json-webpack-plugin')
// const ExtractTextPlugin = require('extract-text-webpack-plugin')
// const webpackLoadPlugins = require('webpack-load-plugins')

const paths = {
  src: path.join(__dirname, 'src'),
  srcJS: path.join(__dirname, 'src', 'js'),
  srcPug: path.join(__dirname, 'src', 'pug'),
  srcStyles: path.join(__dirname, 'src', 'styles'),
  build: path.join(__dirname, 'build'),
}

// let manifestObject = fsExtra.readJsonSync(path.join(paths.src, 'manifest.json'))

module.exports = {
  entry: {
    background: path.join(paths.srcJS, 'background.js'),
    contentScript: path.join(paths.srcJS, 'contentScript.js'),
    options: path.join(paths.srcJS, 'options.js'),
    popup: path.join(paths.srcJS, 'popup.js'),
    vendor: [
      'jquery',
    ]
  },
  devtool: 'source-map',
  output: {
    path: paths.build,
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
      * The json loader is becuase of got library and this: http://bit.ly/2eftCF4
      */
      {
        test: /\.json$/,
        loader: 'json-loader',
        include: [
          /node_modules/
        ],
        ignore: path.join(paths.src, 'manifest.json')
      },
      {
        test: /\.js$/,
        include: [
          paths.srcJS
        ],
        loader: 'babel-loader',
      },
      {
        test: /\.pug$/,
        include: [
          paths.srcPug
        ],
        loader: 'pug-loader',
        query: {  //https://github.com/pugjs/pug-loader#options https://webpack.github.io/docs/using-loaders.html#query-parameters
          pretty: true
        }
      },
      {
        test: /\.styl$/,
        include: [
          paths.srcStyles
        ],
        loader: 'style!css?sourceMap!stylus'
        // loader: ExtractTextPlugin.extract('style', 'css?sourceMap!stylus')
      }
    ]
  },
  resolve: {
    extensions: ['', '.js', '.styl', '.sass']
  },
  plugins: [
    // new WebpackCleanupPlugin(),

    // new WriteJsonPlugin({
    //   object: manifestObject,
    //   path: paths.build,
    //   filename: 'manifest.json'
    // }),

    new CopyWebpackPlugin(
      [
        {
          from: path.join(paths.src, 'icons', 'MSlargeIcon.png'),
          to: path.join(paths.build)
        }
      ],
      {
        copyUnmodified: true
      }
    ),

    /****
    * Need to set up $/jquery as a global
    */
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
    }),

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
    new HtmlWebpackPlugin({
      filename: 'popup.html',
      template: path.join(paths.srcPug, 'popup.pug'),
      // inject: false,
      // showErrors: false,
      // hash: true,
      chunks: [
        'vendor',
        'popup'
      ]
    }),
    new HtmlWebpackPlugin({
      filename: 'options.html',
      template: path.join(paths.srcPug, 'options.pug'),
      // inject: false,
      // showErrors: false,
      // hash: true,
      chunks: [
        'vendor',
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
