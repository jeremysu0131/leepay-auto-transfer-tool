import Vue from "vue";

import "normalize.css";
import ElementUI, { Message } from "element-ui";
import SvgIcon from "vue-svgicon";

import "@/styles/element-variables.scss";
import "@/styles/index.scss";

import App from "@/App.vue";
import store from "@/store";
import router from "@/router";
import "@/icons/components";
import "@/permission";
import { ipcRenderer } from "electron";

ipcRenderer.on("need-to-press-ukey", () => {
  new Audio(require("@/assets/sounds/need-to-press-ukey.mp3")).play();
});
ipcRenderer.on("show-message", () => {
  Message({ message: "Warning, please press ukey manually", type: "warning" });
});

Vue.use(ElementUI);
Vue.use(SvgIcon, {
  tagName: "svg-icon",
  defaultWidth: "1em",
  defaultHeight: "1em"
});

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
