import MerchantModel from "./merchantModel";
import BankModel from "./bankModel";
import PayeeAccountModel from "./payeeAccountModel";
import RemitterAccountModel from "./remitterAccountModel";

export default class TaskDetailModel {
  id = 0;
  amount = 0;
  payeeAccount = new PayeeAccountModel();

  public constructor(init?: Partial<TaskDetailModel>) {
    Object.assign(this, init);
  }
}
