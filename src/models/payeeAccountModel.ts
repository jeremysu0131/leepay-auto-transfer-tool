import AccountModel from "./accountModel";
import BankModel from "./bankModel";

export default class PayeeAccountModel extends AccountModel {
  holderName = "";
  cardNumber = "";
  bank = new BankModel();
}
