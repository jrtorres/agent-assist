var nodeExternals = require('webpack-node-externals');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var WebpackShellPluginNext = require('webpack-shell-plugin-next');
var webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

const path = require('path');
var _ = require('lodash');

module.exports = function (env) {
  const commonConfig = {
    //TODO: change for production
    devtool: 'eval',

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
      alias: {
        "@client": path.join(__dirname, 'src', 'client'),
        "@server": path.join(__dirname, 'src', 'server')
      },
      fallback: {
        "crypto": false
      }
    },

    cache: {
      type: 'memory',
    },

    stats: "minimal",
    bail: false,
    plugins: []
  };

  const commonRules = [
    {
      test: /\.ts$/,
      enforce: 'pre',
      loader: 'tslint-loader',
      options: {
        tsConfigFile: path.join(__dirname, 'tsconfig.json')
      }
    },

    {
      exclude: [path.resolve(__dirname, 'node_modules')],
      test: /\.tsx?$/,
      use: [
        {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      ],
    },

    {
      exclude: [path.resolve(__dirname, 'node_modules')],
      enforce: 'pre',
      test: /\.js$/,
      loader: 'source-map-loader'
    }
  ];

  const client = {
    entry: path.resolve(__dirname, 'src', 'client', 'index.tsx'),

    output: {
      path: path.join(__dirname, 'dist', 'client'),
      filename: 'bundle.[chunkhash].js',
      sourceMapFilename: 'bundle.[chunkhash].map'
    },

    module: {
      rules: _.concat(commonRules, [
        {
          test: /\.(png|jp(e*)g|svg|ico)$/,
          include: [
            path.resolve(__dirname, 'src', 'client', 'static')
          ],
          type: 'asset'
        },
        {
          test: /\.scss$/,
          include: [
            path.resolve(__dirname, 'src', 'client')
          ],
          use: [
            {
              loader: 'style-loader'
            },
            {
              loader: 'css-loader',
              options: {
                importLoaders: 2,
                sourceMap: true
              }
            },
            {
              loader: 'fast-sass-loader',
              options: {
                sassOptions: {
                  includePaths: [
                    path.resolve(__dirname, 'node_modules')
                  ]
                },
                sourceMap: true
              }
            }
          ]
        }
      ])
    },

    plugins: [
      new HtmlWebpackPlugin({
        title: 'Agent Dashboard',
        inject: 'body',
        template: path.join(__dirname, 'src', 'client', 'index.html')
      }),
      new CopyPlugin({
        patterns: [
          {
            from: path.join(__dirname, 'src', 'client', 'locales', '*.json'),
            to: "locales/",
            context: "src/client/locales/"
          },
        ],
      }),
      new ForkTsCheckerWebpackPlugin()
    ]
  };

  const server = {
    entry: path.resolve(__dirname, 'src', 'server', 'index.ts'),

    output: {
      filename: 'index.js',
      path: path.join(__dirname, 'dist', 'server')
    },

    module: {
      rules: commonRules
    },

    target: 'node',

    externals: [nodeExternals()],

    plugins: []
  };

  if (env && env.WATCH === 'true') {
    commonConfig.plugins.push(new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    }));

    server.plugins.push(new WebpackShellPluginNext({
      onBuildEnd: {
        scripts: ['nodemon ./dist/server/index.js --watch ./dist/server'],
        parallel: true
      }
    }));
  }

  function customizer(objValue, srcValue) {
    if (_.isArray(objValue)) {
      return objValue.concat(srcValue);
    }
  }

  return [
    _.mergeWith(client, commonConfig, customizer),
    _.mergeWith(server, commonConfig, customizer)
  ];
};