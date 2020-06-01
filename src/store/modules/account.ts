import * as AccountApi from "@/api/account";
import { VuexModule, Module, Mutation, Action, getModule } from "vuex-module-decorators";
import store from "@/store";
import RemitterAccountModel from "../../models/remitterAccountModel";
import { LogModule } from "./log";

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
  async GetAvailableAccount(): Promise<Array<{ id: number; code: string; balance: number }>> {
    let { data } = await AccountApi.getAvailableAccount();
    return (data.data as Array<{ id: number; name: string }>).map(account => {
      const [code, balance] = account.name.split(" - ");
      return {
        id: account.id,
        code: code.trim(),
        balance: parseFloat(balance.trim())
      };
    });
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
  async GetAccountDetail(accountId: number): Promise<RemitterAccountModel | null> {
    try {
      let response = await AccountApi.getDetailById(accountId);
      const detail = response.data.data;

      if (!detail) throw new Error("Get account detail fail");
      let account = new RemitterAccountModel();
      account.id = accountId;
      account.balance = detail.balance;
      account.code = detail.acctCode;
      account.loginName = detail.acctUsername;
      account.loginPassword = detail.acctPassword;
      account.usbPassword = detail.acctUSBPass;
      account.queryPassword = detail.acctQueryPass;

      return account;
    } catch (error) {
      LogModule.SetConsole({ level: "error", message: error });
      return null;
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
