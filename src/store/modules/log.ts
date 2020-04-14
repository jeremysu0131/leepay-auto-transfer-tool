import {
  VuexModule,
  Module,
  Mutation,
  Action,
  getModule
} from "vuex-module-decorators";
import store from "@/store";
import { MessageBox } from "element-ui";
import logger from "../../utils/logger";
import ILog from "../../models/logModel";

export interface ILogState {
  log: any[];
}

@Module({ dynamic: true, store, name: "log" })
class Log extends VuexModule implements ILogState {
  public log = [];

  // Record log
  @Mutation
  private SET_LOG(logInfo: ILog) {
    const { level, message } = logInfo;
    logger.log({ level, message: message.toString() });
    // this.log.push({ level, message: message.toString() });
  }
  @Mutation
  private UNSET_LOG() {
    this.log = [];
  }

  @Action
  public UnsetLog() {
    this.UNSET_LOG();
  }

  @Action
  public SetLog(logInfo: ILog) {
    let { level, message } = logInfo;
    message = message.toString();
    this.SET_LOG(logInfo);
  }
  @Action
  // Show on application and record log
  public SetConsole(logInfo: ILog) {
    let { level, message } = logInfo;
    message = message.toString();
    // this.HANDLE_TASK_AUTO_PROCESS(false);
    this.SET_LOG(logInfo);

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

export const LogModule = getModule(Log);
