import * as AccountApi from "@/api/account";
import { VuexModule, Module, Mutation, Action, getModule } from "vuex-module-decorators";
import store from "@/store";
import RemitterAccountModel from "../../models/remitterAccountModel";
import { LogModule } from "./log";
import { getBoBalance, getGroup } from "@/api/account";
import AccountModel from "@/models/accountModel";

class AccountListModel {
  id: number = 0;
  code: string = "";
  balance: number = 0;
}
export interface IAccountState {
  list: Array<AccountListModel>;
  selected: RemitterAccountModel;
  // selectedDetail: {};
  current: RemitterAccountModel;
}

@Module({ dynamic: true, store, name: "card" })
class Account extends VuexModule implements IAccountState {
  public list = [] as AccountListModel[];
  public selected = new RemitterAccountModel();
  public current = new RemitterAccountModel();

  @Mutation
  SET_LIST(accounts: AccountListModel[]) {
    this.list = accounts;
  }
  @Mutation
  SET_SIGN_IN_SUCCESS_TIME(time: Date) {
    this.selected.signInSuccessAt = time;
  }
  @Mutation
  SET_BANK_BALANCE(balance: number) {
    this.current.balanceInBank = balance;
  }
  @Mutation
  SET_BANK_BO_BALANCE(balance: number) {
    this.current.balance = balance;
  }
  @Mutation
  SET_SELECTED(account: RemitterAccountModel) {
    this.selected = { ...account };
  }
  @Mutation
  SET_CURRENT(account: RemitterAccountModel) {
    this.current = { ...account };
  }
  @Action
  async GetAccountList(): Promise<Array<AccountModel>> {
    try {
      let { data } = await AccountApi.getList();
      return data.value.map((card: any) => {
        return {
          id: +card.id,
          code: card.bankAcctCode,
          bankCode: card.bank.bankCode
        } as AccountModel;
      });
    } catch (error) {
      LogModule.SetLog({ level: "error", message: error });
      return [];
    }
  }
  @Action
  async Search(accountCode: string): Promise<{ id: number; code: string; balance: number }[]> {
    let { data } = await AccountApi.getList();
    return (data.data as Array<{ key: number; value: string }>)
      .filter(account => account.value.indexOf(accountCode) !== -1)
      .map(account => {
        const [code, balance] = account.value.split("-");
        return {
          id: account.key,
          code: code.trim(),
          balance: parseFloat(balance.trim())
        };
      });
  }
  @Action
  async GetId(accountCode: string): Promise<number> {
    let { data } = await AccountApi.getList();
    let account = (data.data as Array<{ key: number; value: string }>).find(
      account => account.value.indexOf(accountCode) !== -1
    );

    if (!account) throw new Error("Get account id fail");
    return account.key;
  }

  @Action
  async GetAccountDetail(account: AccountModel): Promise<RemitterAccountModel | null> {
    try {
      let [getDetailResult, getBoBalanceResult, getGroupResult, signInInfo] = await Promise.all([
        AccountApi.getDetailById(account.id),
        getBoBalance(account.id),
        getGroup(account.id),
        this.GetAccountSignInInfo(account.code)
      ]);
      const detail = getDetailResult.data.value.virtualAcct;
      if (!detail) throw new Error("Get account detail fail");
      let remitterAccount = new RemitterAccountModel();
      remitterAccount.id = account.id;
      remitterAccount.balance = getBoBalanceResult.data.value[0].availableBalance;
      remitterAccount.code = account.code;
      remitterAccount.group = getGroupResult.data.value[0].accountGroup.groupName;
      remitterAccount.proxy = `${detail.proxy}:8800`;
      remitterAccount.loginName = signInInfo.username;
      remitterAccount.loginPassword = signInInfo.password;
      remitterAccount.usbPassword = signInInfo.usbPassword;
      remitterAccount.queryPassword = signInInfo.queryPassword;

      return remitterAccount;
    } catch (error) {
      LogModule.SetConsole({ level: "error", message: error });
      return null;
    }
  }
  @Action
  private async GetAccountSignInInfo(
    accountCode: string
  ): Promise<{
    username: string;
    password: string;
    usbPassword: string;
    queryPassword: string;
  }> {
    try {
      let accountId;
      let result = await AccountApi.getAccountCodeListInSkypay();
      const accountCodeList = result.data.data;
      for (let index = 0; index < accountCodeList.length; index++) {
        const account = accountCodeList[index];
        if (account.value.indexOf(accountCode) !== -1) {
          accountId = account.key;
          break;
        }
      }
      let accountDetail = await AccountApi.getAccountDetailInSkypay(accountId);
      let data = accountDetail.data.data;
      return {
        username: data.acctUsername,
        password: data.acctPassword,
        usbPassword: data.acctUSBPass,
        queryPassword: data.acctQueryPass
      };
    } catch (error) {
      throw new Error("Get account sign in info fail. Error: " + error);
    }
  }

  @Action({ rawError: true })
  async GetProxy(accountId: number): Promise<string> {
    let response = await AccountApi.getAssignedProxy(accountId);
    let data = response.data.data;
    if (data.length === 0) {
      LogModule.SetConsole({
        level: "error",
        message: "Proxy not assigned to this account"
      });
      return "";
    } else {
      let proxy = data[0].value.split("http://")[1];
      return proxy;
    }
  }

  @Action
  async UnsetAccount() {
    this.SET_CURRENT(new RemitterAccountModel());
    this.SET_SELECTED(new RemitterAccountModel());
  }
}

export const AccountModule = getModule(Account);
