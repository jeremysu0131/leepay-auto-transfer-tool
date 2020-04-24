import { IpcMain, Event, IpcRenderer } from "electron";
import BankWorker from "./workers/BankWorker";

//  const communicator = (ipcMain: IpcMain) => {
//   ipcMain.on("asynchronous-message", async(event: Event, arg: any) => {
//     console.log(arg);
//     switch (arg) {
//       case "SET_WORKER":
//         console.log("run");
//         worker = new BankWorker({} as TaskDetailModel);
//         await worker.launchSelenium();
//         break;

//       default:
//         console.log("rund");
//         break;
//     }

//     event.sender.send("asynchronous-reply", "c reply");
//   });
// };

export const transponder = async (
  ipcRenderer: IpcRenderer,
  flowName: any,
  flowArgs?: any
): Promise<{
  isFlowExecutedSuccess: boolean;
  message?: string;
  balance?: number;
}> => {
  return new Promise(resolve => {
    ipcRenderer.once(
      "asynchronous-reply",
      (
        event: Event,
        {
          isFlowExecutedSuccess,
          message,
          balance
        }: {
          isFlowExecutedSuccess: boolean;
          message?: string;
          balance?: number;
        }
      ) => {
        resolve({ isFlowExecutedSuccess, message, balance });
      }
    );
    ipcRenderer.send("asynchronous-message", flowName, flowArgs);
  });
};
