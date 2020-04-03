import { IpcMain, Event, IpcRenderer } from "electron";

export const communicator = (ipcMain: IpcMain) => {
  ipcMain.on("asynchronous-message", (event: Event, arg: any) => {
    console.log(arg);
    event.sender.send("asynchronous-reply", "pong");
  });
};

export const transponder = (ipcRenderer: IpcRenderer, arg: any) => {
  ipcRenderer.once("asynchronous-reply", (event: Event, arg: any) => {
    console.log(arg);
  });
  ipcRenderer.send("asynchronous-message", arg);
};
