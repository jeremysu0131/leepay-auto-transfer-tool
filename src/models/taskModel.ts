import MerchantModel from "./merchantModel";
import BankModel from "./bankModel";
import TaskTypeEnum from "@/enums/taskTypeEnum";
import TaskStatusEnum from "@/enums/taskStatusEnum";
import TaskCheckToolModel from "./taskCheckToolModel";
import LeepayTaskStatusEnum from "@/enums/leepayTaskStatusEnum";

export default class TaskModel {
  id = 0;
  amount = 0;
  checkTool = new TaskCheckToolModel();
  assignee = "";
  assigneeId = 0;
  assignedAt = new Date();
  bank = new BankModel();
  customer = "";
  merchant = "";
  transferFee = 0;
  remitterAccountCode = "";
  payeeAccountCode = "";
  pendingTime = 0;
  priority = 0;
  remark = "";
  ref = "";
  createdAt = "";
  createdBy = 0;
  updatedAt = new Date();
  updatedBy = 0;
  status = LeepayTaskStatusEnum.I;
}
