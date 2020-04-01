import MerchantModel from "./merchantModel";
import BankModel from "./bankModel";
import PayeeAccountModel from "./payeeAccountModel";
import RemitterAccountModel from "./remitterAccountModel";

export default class TaskDetailModel {
  id = 6583757;
  amount = 102;
  payeeAccount = new PayeeAccountModel();
  remitterAccount = new RemitterAccountModel();

  // bcPkgCount = 0;
  // bcPkgEnabled = "N";
  // isUnderProm = "N";
  // outstandingBalance = 0;
  // wdBigAmt = 30000;

  public constructor(init?: Partial<TaskDetailModel>) {
    Object.assign(this, init);
  }
}
