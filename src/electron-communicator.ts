import { IpcMain, Event, IpcRenderer } from "electron";
import BankWorker from "./workers/BankWorker";
import WorkerResponseModel from "./workers/models/workerResponseModel";
import WorkerIeStatusResponseModel from "./workers/models/workerIeStatusResponseModel";
import WorkerBalanceResponseModel from "./workers/models/workerBalanceResponseModel";
import WorkerTransferFeeResponseModel from "./workers/models/workerTransferFeeResponseModel";

export async function transponder<T>(
  ipcRenderer: IpcRenderer,
  flowName: any,
  flowArgs?: any
): Promise<
  WorkerResponseModel | WorkerBalanceResponseModel | WorkerIeStatusResponseModel | WorkerTransferFeeResponseModel
> {
  return new Promise(resolve => {
    ipcRenderer.once(
      "asynchronous-reply",
      (
        event: Event,
        executedResult:
          | WorkerResponseModel
          | WorkerBalanceResponseModel
          | WorkerIeStatusResponseModel
          | WorkerTransferFeeResponseModel
      ) => resolve(executedResult)
    );
    ipcRenderer.send("asynchronous-message", flowName, flowArgs);
  });
}
