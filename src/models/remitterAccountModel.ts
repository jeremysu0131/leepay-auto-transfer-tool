import AccountModel from "./accountModel";

export default class RemitterAccountModel extends AccountModel {
  id = 0;
  balance = 0;
  balanceInBank? = 0;
  code = "";
  loginName = "";
  loginPassword = "";
  usbPassword = "";
  queryPassword? = "";
  proxy = "";
  signInSuccessAt?: Date;
}
