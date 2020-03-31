import MerchantModel from "./merchantModel";

export default class TaskModel {
  id = 0;
  amount = 0;
  asignee = "";
  asigneeId = 0;
  assignedAt = Date;
  transferFee = 0;
  remitterAccount = "";
  payeeAccount = "";
  merchant = new MerchantModel();
  pendingTime = 0;
  remark = "";
  createdAt = Date;
  createdBy = 0;
  updatedAt = Date;
  updatedBy = 0;
  workflow = "";
}
