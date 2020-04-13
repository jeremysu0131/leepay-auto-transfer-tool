import AccountModel from "./accountModel";

export default class RemitterAccountModel extends AccountModel {
  balance = 0;
  code = "";
  loginName = "";
  loginPassword = "";
  usbPassword = "";
  proxy = "";
}
