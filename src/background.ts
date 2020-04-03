"use strict";

import {
  app,
  protocol,
  BrowserWindow,
  ipcMain,
  IpcMain,
  Event
} from "electron";
import {
  createProtocol,
  installVueDevtools
} from "vue-cli-plugin-electron-builder/lib";
import BankWorker from "./workers/BankWorker";
import { WorkflowEnum } from "./workers/utils/workflowHelper";
import logger from "./workers/utils/logger";
import RemitterAccountModel from "./workers/models/remitterAccountModel";
const isDevelopment = process.env.NODE_ENV !== "production";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null;
let worker: BankWorker;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } }
]);

const workerCommunicator = (ipcMain: IpcMain) => {
  ipcMain.on(
    "asynchronous-message",
    async(event: Event, flowName: any, flowArgs: any) => {
      let flowExecutedResult = false;
      logger.debug(flowName);
      // eslint-disable-next-line no-async-promise-executor
      await new Promise(async(resolve, reject) => {
        switch (flowName) {
          case WorkflowEnum.SET_WORKER:
            if (worker) worker.closeSelenium();
            worker = new BankWorker(flowArgs as RemitterAccountModel);
            return true;
          case WorkflowEnum.CLOSE_SELENIUM:
            return resolve(await worker.closeSelenium());
          case WorkflowEnum.CHECK_IF_LOGIN_SUCCESS:
            return resolve(await worker.checkIfLoginSuccess(flowArgs));
          case WorkflowEnum.CHECK_IF_SUCCESS:
            return resolve(await worker.checkIfSuccess());
          case WorkflowEnum.CONFIRM_TRANSACTION:
            return resolve(await worker.confirmTransaction());
          case WorkflowEnum.FILL_NOTE:
            return resolve(await worker.fillNote());
          case WorkflowEnum.FILL_TRANSFER_INFORMATION:
            return resolve(await worker.fillTransferFrom());
          case WorkflowEnum.GET_BALANCE:
            return resolve(await worker.getBalance());
          case WorkflowEnum.GET_COOKIE:
            return resolve(await worker.getCookie());
          case WorkflowEnum.GO_TRANSFER_PAGE:
            return resolve(await worker.goTransferPage());
          case WorkflowEnum.INPUT_SIGN_IN_INFORMATION:
            return resolve(await worker.inputSignInInformation());
          case WorkflowEnum.LAUNCH_SELENIUM:
            return resolve(await worker.launchSelenium());
          case WorkflowEnum.SEND_USB_KEY:
            return resolve(await worker.sendUSBKey());
          case WorkflowEnum.SET_IE_ENVIRONMENT:
            return resolve(worker.setIEEnvironment());
          case WorkflowEnum.SET_PROXY:
            return resolve(await worker.setProxy());
          case WorkflowEnum.SUBMIT_TO_SIGN_IN:
            return resolve(await worker.submitToSignIn());
          default:
            logger.warn("No such workflow");
            return resolve(false);
        }
      }).then(result => {
        event.sender.send("asynchronous-reply", result);
      });
    }
  );
};

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
    }
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");
  }

  win.on("closed", () => {
    win = null;
  });
  workerCommunicator(ipcMain);
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async() => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installVueDevtools();
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", data => {
      if (data === "graceful-exit") {
        worker.closeSelenium();
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
