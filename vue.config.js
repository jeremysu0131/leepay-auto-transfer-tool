const path = require("path");
const { version } = require("./package.json");
const name = `Bank Auto Transfer (Version ${version})`;

module.exports = {
  // TODO: Remember to change this to fit your need
  publicPath:
    process.env.NODE_ENV === "production"
      ? "/vue-typescript-admin-template/"
      : "/",
  lintOnSave: process.env.NODE_ENV === "development",
  pluginOptions: {
    // exposeEnv: ["PATH"],
    "style-resources-loader": {
      preProcessor: "scss",
      patterns: [
        path.resolve(__dirname, "src/styles/_variables.scss"),
        path.resolve(__dirname, "src/styles/_mixins.scss")
      ]
    }
  },
  chainWebpack(config) {
    // Provide the app's title in webpack's name field, so that
    // it can be accessed in index.html to inject the correct title.
    config.set("name", name);
  }
};
