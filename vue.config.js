const path = require("path");
const { version } = require("./package.json");
const name = `Bank Auto Transfer (Version ${version})`;
process.env.VUE_APP_VERSION = version;

module.exports = {
  // TODO: Remember to change this to fit your need
  publicPath: process.env.NODE_ENV === "production" ? "/vue-typescript-admin-template/" : "/",
  lintOnSave: process.env.NODE_ENV === "development",
  pluginOptions: {
    // exposeEnv: ["PATH"],
    "style-resources-loader": {
      preProcessor: "scss",
      patterns: [
        path.resolve(__dirname, "src/styles/_variables.scss"),
        path.resolve(__dirname, "src/styles/_mixins.scss")
      ]
    },
    electronBuilder: {
      builderOptions: {
        extraResources: [
          {
            from: "bankWorkerTool",
            to: "bankWorkerTool",
            filter: ["**/*"]
          }
        ],
        win: {
          requestedExecutionLevel: "highestAvailable",
          extraFiles: ["IEDriverServer.exe"]
        }
      },
      chainWebpackMainProcess: config => {
        // Chain webpack config for electron main process only
      },
      chainWebpackRendererProcess: config => {
        // Chain webpack config for electron renderer process only
        // The following example will set IS_ELECTRON to true in your app
        config.plugin("define").tap(args => {
          args[0]["process.env.FLUENTFFMPEG_COV"] = false;
          return args;
        });
      },
      // Provide an array of files that, when changed, will recompile the main process and restart Electron
      // Your main process file will be added by default
      mainProcessWatch: ["src/workers"]
    }
  },
  chainWebpack(config) {
    // Provide the app's title in webpack's name field, so that
    // it can be accessed in index.html to inject the correct title.
    config.set("name", name);
  }
};
