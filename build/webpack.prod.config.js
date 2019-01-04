const path = require("path");
const webpack = require("webpack");

const merge = require("webpack-merge");
const baseWpConfig = require("./webpack.base.config");
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const publicDir = path.resolve(__dirname, '../dist/public');
const clientDir = path.resolve(__dirname, '../client');

module.exports = merge(baseWpConfig, {
    mode: 'production',
    output: {
        path: `${publicDir}/app`,
        filename: 'bundle.[contenthash].js'
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: "vue-loader",
            },
            {
                test: /\.css$/,
                use: [
                  MiniCssExtractPlugin.loader,
                  'css-loader'
                ]
            }
        ]
    },
    optimization: {
        minimizer: [
            new TerserPlugin(),
            new OptimizeCSSAssetsPlugin()
        ]
    },
    plugins: [
        new CleanWebpackPlugin([`${publicDir}`], {root: path.resolve(__dirname, '..')}),
        new MiniCssExtractPlugin({
            filename: "[name].[contenthash].css"
        }),
        new HtmlWebpackPlugin({
            template: `${clientDir}/index.html.template`,
            filename: `${publicDir}/index.html`
        })
    ]
});
