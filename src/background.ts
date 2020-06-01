"use strict";

import { app, protocol, BrowserWindow, ipcMain, IpcMain, Event, screen } from "electron";
import { createProtocol, installVueDevtools } from "vue-cli-plugin-electron-builder/lib";
import BankWorker from "./workers/BankWorker";
import { WorkflowEnum } from "./workers/utils/workflowHelper";
import RemitterAccountModel from "./workers/models/remitterAccountModel";
import WorkerIeStatusResponseModel from "./workers/models/workerIeStatusResponseModel";
import LoggerService from "./workers/utils/LoggerService";
const isDevelopment = process.env.NODE_ENV !== "production";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null;
let worker: BankWorker;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { secure: true, standard: true } }]);
export async function needToPressUkey() {
  if (win) win.webContents.send("need-to-press-ukey");
}
export async function showMessage() {
  if (win) win.webContents.send("show-message");
}

function workerCommunicator(ipcMain: IpcMain) {
  let logger = new LoggerService(workerCommunicator.name);
  ipcMain.on("asynchronous-message", async (event: Event, flowName: any, flowArgs: any) => {
    if (flowName !== WorkflowEnum.CHECK_IF_IE_CLOSED) {
      logger.debug(`Running flow name: ${flowName}, args: ${JSON.stringify(flowArgs)}`);
    }
    try {
      // eslint-disable-next-line no-async-promise-executor
      let result = await new Promise(async (resolve, reject) => {
        try {
          switch (flowName) {
            case WorkflowEnum.CHECK_IF_IE_CLOSED:
              // if worker is undefined means there hasn't any IE opened
              if (!worker) {
                return resolve({
                  success: true,
                  isIeClosed: true
                } as WorkerIeStatusResponseModel);
              }
              return resolve(await worker.checkIfIeClosed());
            case WorkflowEnum.SET_WORKER:
              if (worker) worker.closeSelenium();
              worker = new BankWorker(flowArgs as RemitterAccountModel);
              return resolve({ success: true });
            case WorkflowEnum.UNSET_WORKER:
              if (worker) worker.closeSelenium();
              worker = (null as unknown) as BankWorker;
              return resolve({ success: true });
            case WorkflowEnum.SET_ACCOUNT_BO_BALANCE:
              return resolve(worker.setAccountBalance(flowArgs));
            case WorkflowEnum.SET_TASK:
              return resolve(worker.setTask(flowArgs));
            case WorkflowEnum.CLOSE_SELENIUM:
              return resolve(await worker.closeSelenium());
            case WorkflowEnum.CHECK_IF_LOGIN_SUCCESS:
              return resolve(await worker.checkIfLoginSuccess(flowArgs));
            case WorkflowEnum.CHECK_IF_SUCCESS:
              return resolve(await worker.checkIfTransactionSuccess());
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
              return resolve(await worker.launchSelenium(flowArgs));
            case WorkflowEnum.SEND_USB_KEY:
              return resolve(await worker.sendUSBKey());
            case WorkflowEnum.SET_IE_ENVIRONMENT:
              return resolve(await worker.setIEEnvironment());
            case WorkflowEnum.SET_PROXY:
              return resolve(await worker.setProxy());
            case WorkflowEnum.SUBMIT_TO_SIGN_IN:
              return resolve(await worker.submitToSignIn());
            default:
              logger.warn("No such workflow");
              return reject(new Error("No such workflow"));
          }
        } catch (error) {
          reject(error);
        }
      });

      event.sender.send("asynchronous-reply", result);
    } catch (error) {
      event.sender.send("asynchronous-reply", {
        success: false,
        message: `${error.name} ${error.message} ${error.stack}`
      });
    }
  });
}

function createWindow() {
  // Create the browser window.
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
    },
    height,
    width: process.env.NODE_ENV === "production" ? width * (1 / 2) : width,
    useContentSize: true,
    x: process.env.NODE_ENV === "production" ? width * (1 / 2) : 0,
    y: 0
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
    let logger = new LoggerService("background.ts");
    logger.info("User close window");
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
app.on("ready", async () => {
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
