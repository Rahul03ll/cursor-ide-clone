module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Disable React error overlay in development
      if (env === 'development') {
        webpackConfig.devServer = {
          ...webpackConfig.devServer,
          client: {
            ...webpackConfig.devServer?.client,
            overlay: false
          }
        };
      }
      
      return {
        ...webpackConfig,
        output: {
          ...webpackConfig.output,
          publicPath: "/",
          globalObject: "self"
        },
        resolve: {
          ...webpackConfig.resolve,
          fallback: {
            ...webpackConfig.resolve?.fallback,
            path: false,
            fs: false,
            crypto: false,
            stream: false,
            assert: false,
            os: false
          }
        },
        externals: {
          ...webpackConfig.externals,
          electron: "commonjs electron"
        },
        module: {
          ...webpackConfig.module,
          rules: [
            ...webpackConfig.module.rules,
            {
              test: /\.js$/,
              enforce: "pre",
              use: ["source-map-loader"],
            }
          ]
        },
        ignoreWarnings: [/Failed to parse source map/, /Can't resolve 'monaco-editor\/.*\/.*\.worker/]
      };
    }
  }
};
