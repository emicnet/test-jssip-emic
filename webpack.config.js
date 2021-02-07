// const HtmlWebPackPlugin = require('html-webpack-plugin')
// const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const webpack = require('webpack') //to access built-in plugins
const path = require('path')

module.exports = {
    entry: {
        index: './index.js',
        monitor: './monitor.js',
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
        ],
    },
    devServer: {
        writeToDisk: true,
        // host: '0.0.0.0',
    },
    devtool: 'source-map',
}
