import { MessageBox } from "element-ui";
import logger from "../../utils/logger";
// Log level
// {
//   error: 0,
//   warn: 1,
//   info: 2,
//   verbose: 3,
//   debug: 4,
//   silly: 5
// }
const worker = {
  state: { log: [], console: [] },

  mutations: {
    // Record log
    SET_LOG: (state, { level, message }) => {
      logger.log({ level, message: message.toString() });
      // state.log.push({ level, message: message.toString() });
    },
    UNSET_LOG: state => {
      state.log = [];
    },
    // Show on application and record log
    SET_CONSOLE: (state, { level, message }) => {
      logger.log({ level, message: message.toString() });
      // state.console.push({ level, message });
    },
    UNSET_CONSOLE: state => {
      state.console = [];
    },
  },

  actions: {
    UnsetLog({ commit }) {
      commit("UNSET_LOG", []);
      commit("UNSET_CONSOLE", []);
    },
    SetConsole({ commit }, { level, message }) {
      commit("HANDLE_TASK_AUTO_PROCESS", false);
      commit("SET_CONSOLE", { level, message });

      var audio = new Audio(require("@/assets/sounds/alarm.mp3"));
      var transferTime = 0;
      var transferTimer = setInterval(async () => {
        if (transferTime % 5 === 0) {
          audio.play();
        }
        transferTime++;
      }, 1 * 1000);

      MessageBox.alert(message.toString(), "", {
        confirmButtonText: "OK",
        type: "error",
        customClass: "error-message-box",
        confirmButtonClass: "error-message-box--button",
        showClose: false,
        callback: () => {
          audio.pause();
          clearInterval(transferTimer);
        },
      });
    },
  },
};

export default worker;
