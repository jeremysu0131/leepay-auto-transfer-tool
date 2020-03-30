import {
  VuexModule,
  Module,
  Mutation,
  Action,
  getModule
} from "vuex-module-decorators";
import store from "@/store";
import { MessageBox } from "element-ui";
import { LogEntry } from "winston";
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

export interface ILogState {
  log: any[];
  console: any[];
}

@Module({ dynamic: true, store, name: "log" })
class Log extends VuexModule implements ILogState {
  public log = [];
  public console = [];

  // Record log
  @Mutation private SET_LOG(logInfo: LogEntry) {
    const { level, message } = logInfo;
    logger.log({ level, message: message.toString() });
    // this.log.push({ level, message: message.toString() });
  }
  @Mutation
  private UNSET_LOG() {
    this.log = [];
  }
  // Show on application and record log
  @Mutation
  private SET_CONSOLE(logInfo: LogEntry) {
    const { level, message } = logInfo;
    logger.log({ level, message: message.toString() });
    // this.console.push({ level, message });
  }
  @Mutation
  private UNSET_CONSOLE() {
    this.console = [];
  }

  @Action
  public UnsetLog() {
    this.UNSET_LOG();
    this.UNSET_CONSOLE();
  }
  @Action
  public SetConsole(logInfo: LogEntry) {
    // this.HANDLE_TASK_AUTO_PROCESS(false);
    this.SET_CONSOLE(logInfo);

    var audio = new Audio(require("@/assets/sounds/alarm.mp3"));
    var transferTime = 0;
    var transferTimer = setInterval(() => {
      if (transferTime % 5 === 0) {
        audio.play();
      }
      transferTime++;
    }, 1 * 1000);

    MessageBox.alert(logInfo.message, "", {
      confirmButtonText: "OK",
      type: "error",
      customClass: "error-message-box",
      confirmButtonClass: "error-message-box--button",
      showClose: false,
      callback: () => {
        audio.pause();
        clearInterval(transferTimer);
      }
    });
  }
}
