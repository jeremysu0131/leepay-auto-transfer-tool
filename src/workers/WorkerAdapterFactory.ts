import { IWorkerAdapter } from "./IWorkerAdapter";
import { ABCWorkerAdapter } from './bankAdapters';

/**
 * Worker Adapter Factory
 */
export class WorkerAdapterFactory {
    /**
     * 產生銀行 Woker Adapter
     * @param accountCode 帳戶代碼
     */
    public static createWorkerAdapter(accountCode: string): IWorkerAdapter {
        if (accountCode.indexOf("ABC") !== -1) return new ABCWorkerAdapter(); // 農業銀行
        // else if (accountCode.indexOf("BCM") !== -1) return new BCMWorker();
        // else if (accountCode.indexOf("BOB") !== -1) return new BOBWorker();
        // else if (accountCode.indexOf("BOC") !== -1) return new BOCWorker();
        // else if (accountCode.indexOf("CCB") !== -1) return new CCBWorker();
        // else if (accountCode.indexOf("CITIC") !== -1) return new CITICWorker();
        // else if (accountCode.indexOf("CMBC") !== -1) return new CMBCWorker();
        // else if (accountCode.indexOf("HRBB") !== -1) return new HRBBWorker();
        // else if (accountCode.indexOf("ICBC") !== -1) return new ICBCWorker();
        // else if (accountCode.indexOf("JZB") !== -1) return new JZBWorker();
        // else if (accountCode.indexOf("PINGAN") !== -1) return new PINGANWorker();
        // else if (accountCode.indexOf("PSBC") !== -1) return new PSBCWorker();
        throw new Error("No such bank rule");    
    }
}
