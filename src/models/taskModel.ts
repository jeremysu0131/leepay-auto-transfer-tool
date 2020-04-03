import MerchantModel from "./merchantModel";
import BankModel from "./bankModel";

export default class TaskModel {
  id = 0;
  amount = 0;
  assignee = "";
  assigneeId = 0;
  assignedAt = Date;
  bank=new BankModel();
  transferFee = 0;
  remitterAccount = "";
  payeeAccount = "";
  merchant = new MerchantModel();
  pendingTime = 0;
  remark = "";
  ref="";
  createdAt = Date;
  createdBy = 0;
  updatedAt = Date;
  updatedBy = 0;
  workflow = "";
}
