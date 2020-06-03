import MerchantModel from "./merchantModel";
import BankModel from "./bankModel";
import PayeeAccountModel from "./payeeAccountModel";
import RemitterAccountModel from "./remitterAccountModel";
import TaskTypeEnum from "../enums/taskTypeEnum";
import TaskStatusEnum from "@/enums/taskStatusEnum";

export default class TaskDetailViewModel {
  id = 0;
  amount = 0;
  transferFee = 0;
  payeeAccount = new PayeeAccountModel();

  public constructor(init?: Partial<TaskDetailViewModel>) {
    Object.assign(this, init);
  }
}
