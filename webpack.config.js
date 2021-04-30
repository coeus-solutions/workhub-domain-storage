const path = require('path');
const webpack = require('webpack');

const env = process.env.NODE_ENV;
const libraryName = '[name]';

const plugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(env),
  }),
];

let outputFile;
if (env === 'production') {
  plugins.push(new webpack.LoaderOptionsPlugin({
    minimize: true,
  }));
  outputFile = `${libraryName}.min.js`;
} else {
  outputFile = `${libraryName}.js`;
}

module.exports = {
  entry: {
    'DomainStorage': [
      path.join(__dirname, '/src/DomainStorage.js')
    ],
    'DomainStorageServer': [
      path.join(__dirname, '/src/DomainStorageServer.js')
    ]
  },

  devtool: 'source-map',

  output: {
    path: path.join(__dirname, 'dist'),
    filename: outputFile,
    library: libraryName,
    libraryTarget: 'umd',
    libraryExport: 'default',
    umdNamedDefine: true,
  },

  resolve: {
    modules: [
      path.join(__dirname, './'),
      'node_modules',
    ],

    extensions: ['.js', '.jsx'],
  },

  module: {
    rules: [
      {
        test: /\.(jsx|js)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },

  plugins,
};
