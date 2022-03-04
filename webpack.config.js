const path = require('path');

module.exports = {
  entry: './src/Bernays.js',
  mode: 'production',
  output: {
    filename: 'bernays.min.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};