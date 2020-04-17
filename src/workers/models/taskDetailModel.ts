import MerchantModel from "./merchantModel";
import BankModel from "./bankModel";
import PayeeAccountModel from "./payeeAccountModel";
import RemitterAccountModel from "./remitterAccountModel";
import { BaseModel } from "./baseModel";

export default class TaskDetailModel extends BaseModel<TaskDetailModel> {
  id = 0;
  amount = 0;
  bankCharge = 0;
  payeeAccount = new PayeeAccountModel();
}
