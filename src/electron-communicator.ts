import { IpcMain, Event, IpcRenderer } from "electron";
import BankWorker from "./workers/BankWorker";
import TaskDetailModel from "./models/taskDetailModel";
import { Builder } from "selenium-webdriver";

var worker;

export const communicator = (ipcMain: IpcMain) => {
  ipcMain.on("asynchronous-message", async(event: Event, arg: any) => {
    console.log(arg);
    switch (arg) {
      case "SET_WORKER":
        console.log("run");
        worker = new BankWorker({} as TaskDetailModel);
        // await worker.launchSelenium();
        break;

      default:
        console.log("rund");
        break;
    }
    // await new Builder()
    //   .withCapabilities({
    //     ignoreZoomSetting: true
    //     // requireWindowFocus: true
    //   })
    //   .forBrowser("ie")
    //   .build();

    event.sender.send("asynchronous-reply", "c reply");
  });
};

export const transponder = (ipcRenderer: IpcRenderer, arg: any) => {
  ipcRenderer.once("asynchronous-reply", (event: Event, arg: any) => {
    console.log(arg);
  });
  ipcRenderer.send("asynchronous-message", arg);
};
