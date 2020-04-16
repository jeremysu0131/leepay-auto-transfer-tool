import MerchantModel from "./merchantModel";
import BankModel from "./bankModel";
import TaskTypeEnum from "@/enums/taskTypeEnum";

export default class TaskModel {
  id = 0;
  amount = 0;
  assignee = "";
  assigneeId = 0;
  assignedAt = Date;
  bank = new BankModel();
  transferFee = 0;
  remitterAccountCode = "";
  payeeAccountCode = "";
  pendingTime = 0;
  priority = 0;
  remark = "";
  ref = "";
  createdAt = Date;
  createdBy = 0;
  updatedAt = Date;
  updatedBy = 0;
  workflow:TaskTypeEnum = TaskTypeEnum.FUND_TRANSFER;
}
