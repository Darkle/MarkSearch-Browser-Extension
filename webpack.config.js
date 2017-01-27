
const path = require('path')

const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const BabiliPlugin = require('babili-webpack-plugin')
const WebpackCleanupPlugin = require('webpack-cleanup-plugin')
// const merge = require('webpack-merge')

const browsers = {
  chrome: 'Chrome',
  firefox: 'Firefox',
  edge: 'Edge',
  opera: 'Opera'
}

const browserBuildingFor = browsers[process.env.browser] || 'Chrome'
const browserBuildFolder = `${ browserBuildingFor }Build`
const isProduction = process.env.NODE_ENV === 'production'

const paths = {
  srcBase: path.join(__dirname, 'src'),
  srcJS: path.join(__dirname, 'src', 'js'),
  srcJSContentScript: path.join(__dirname, 'src', 'js', 'contentScripts'),
  srcJSOptions: path.join(__dirname, 'src', 'js', 'options'),
  srcPug: path.join(__dirname, 'src', 'pug'),
  srcImages: path.join(__dirname, 'src', 'images'),
  srcFonts: path.join(__dirname, 'src', 'fonts'),
  inlineStyles: path.join(__dirname, 'src', 'inlineStyles'),
  nonInlineStyles: path.join(__dirname, 'src', 'nonInlineStyles'),
  buildBase: path.join(__dirname, browserBuildFolder),
  buildJS: path.join(__dirname, browserBuildFolder, 'js'),
  buildHTML: path.join(__dirname, browserBuildFolder, 'html'),
  buildImages: path.join(__dirname, browserBuildFolder, 'images'),
  buildFonts: path.join(__dirname, browserBuildFolder, 'fonts'),
  buildStylesheets: path.join(__dirname, browserBuildFolder, 'stylesheets'),
}

const webpackConfig = {
  devtool: 'source-map',
  target: 'web',
  performance: {
    hints: false   // we enable this in production
  },
  entry: {
    background: path.join(paths.srcJS, 'background.js'),
    options: path.join(paths.srcJSOptions, 'options.js'),
    googleSearch_ContentScript: path.join(paths.srcJSContentScript, 'google', 'googleSearch_ContentScript.js'),
    // googleSearch_ContentScriptStyleSheet: path.join(paths.nonInlineStyles, 'googleSearch_ContentScript.styl'),
    duckduckgoSearch_ContentScript: path.join(paths.srcJSContentScript, 'duckduckgo', 'duckduckgoSearch_ContentScript.js'),
    // duckduckgoSearch_ContentScriptStyleSheet: path.join(paths.nonInlineStyles, 'duckduckgoSearch_ContentScript.styl'),
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
        use: [
          {
            loader: 'eslint-loader'
          },
        ],
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
        use: [
          {
            loader: 'pug-loader',
            options: {
              pretty: true
            }
          },
        ],
      },
      /*****
      * These are inline styles. We execute the now notification script dynamically, so putting the CSS in the JS
      * makes things easy.
      */
      {
        test: /\.styl$/,
        include: [
          paths.inlineStyles
        ],
        exclude: [
          paths.nonInlineStyles
        ],
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'stylus-loader',
          },
        ]
      },
      /*****
      * These styles are for the main content scripts for google and duckduckgo. We don't run them dynamically, so
      * we can declare them in the manifest and have them as regular seperate CSS stylesheets.
      */
      {
        test: /\.styl$/,
        include: [
          paths.nonInlineStyles
        ],
        exclude: [
          paths.inlineStyles
        ],
        /*****
        * Note: at the moment (as of 2.0.0-beta.5 of extract-text-webpack-plugin), you have to attach it to the
        * old "loader" key rather than the new "use" key to get it to work.
        * https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/330
        * Note: need to use 'query' for loader options for the moment, although that should change to 'options'
        * when the v2 of the extract-text-webpack-plugin comes out of beta: http://bit.ly/2j6P85H
        */
        loader: ExtractTextPlugin.extract({
          fallbackLoader: 'style-loader',
          loader: [
            {
              loader: 'css-loader',
              query: {
                minimize: isProduction,
                sourceMap: !isProduction,
              }
            },
            {
              loader: 'stylus-loader',
              query: {
                paths: paths.nonInlineStyles
              }
            }
          ]
        }),
      },
      /*****
      * This is a bit hackey, but there doesnt seem to be an easy way to disable url-loading for a single font import.
      * Need to have this font non-inlined cause this is for the notification box and it runs on all pages and
      * some pages (e.g. github) have a CSP that disables inline data uri's (the inline font looks
      * like data:application/font-woff2;base64,...`)
      */
      {
        test: /\.woff2NonInline$/,
        include: [
          paths.srcFonts
        ],
        loader: 'file-loader',
        options: {
          name: '../fonts/[name].woff2'
        }
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
      },
      // {
      //   test: /\.ttf$/,
      //   include: [
      //     paths.srcFonts
      //   ],
      //   loader: 'url-loader',
      //   options: {
      //     mimetype: 'application/x-font-ttf'
      //   }
      // }
    ]
  },
  resolve: {
    // modules: [path.resolve('src' 'nonInlineStyles'), 'node_modules'],
    extensions: ['.js', '.styl', '.sass', '.woff2', '.woff2NonInline']
  },
  plugins: [
    new webpack.DefinePlugin({
      'global__browserVendor': browserBuildingFor,
      'global__isProduction': isProduction
    }),
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
    // To remove the locale files from moment cause they are huge!
    // https://github.com/moment/moment-timezone/issues/356#issuecomment-225258637
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
  ]
}

if(isProduction){
  console.log('Running production.')
  /*****
  * https://webpack.js.org/configuration/devtool/#for-production
  * http://cheng.logdown.com/posts/2016/03/25/679045
  */
  webpackConfig.devtool = 'cheap-module-source-map'
  webpackConfig.performance.hints = 'error'
  /*****
  * Note: we do a check when setting up the ExtractTextPlugin if its production
  * so we can enable minimizing - we do it there as its easier than finding that rule manually here.
  */
  // console.log(webpackConfig.module.rules.find())
  /*****
  * Remove the source maps before build for production.
  */
  webpackConfig.plugins.push(new WebpackCleanupPlugin())
  webpackConfig.plugins.push(
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  )
  // https://github.com/babel/babili
  // http://babeljs.io/blog/2016/08/30/babili
  // webpackConfig.module.rules.push(
  //   {
  //     test: /\.js$/,
  //     loader: 'babel-loader',
  //     query: {
  //       presets: ['babili'],
  //       sourceMaps: false,
  //       babelrc: false,
  //       inputSourceMap: null
  //     }
  //   }
  // )
  /*****
  * The BabiliPlugin seems to generate smaller code.
  */
  webpackConfig.plugins.push(new BabiliPlugin({comments: false, sourceMap: false}))
}
if(process.env.runBundleAnalyzer === 'true'){
  console.log('Running bundle analyser.')
  webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}

module.exports = webpackConfig
