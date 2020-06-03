import BankModel from "./bankModel";

export default class PayeeAccountModel {
  holderName = "";
  cardNumber = "";
  bank = new BankModel();
}
