import { BaseModel } from "./baseModel";

export class WorkerResponseModel extends BaseModel<WorkerResponseModel> {
  isFlowExecutedSuccess: boolean = false;
  message?: string;
}
