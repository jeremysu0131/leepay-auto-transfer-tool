import * as AccountApi from "../../api/account";
import {
  VuexModule,
  Module,
  Mutation,
  Action,
  getModule
} from "vuex-module-decorators";
import store from "@/store";

export interface IAccountState {
  selected: {};
  selectedDetail: {};
  current: {};
  currentDetail: {};
}

@Module({ dynamic: true, store, name: "card" })
class Card extends VuexModule implements IAccountState {
  public selected = {
    id: "",
    accountCode: "",
    bankCode: "",
    balanceInSystem: 0,
    balanceInOnlineBank: 0,
    accountName: "",
    accountPassword: "",
    queryPassword: "",
    usbPassword: "",
    proxy: "",
    cookie: "",
    session: ""
  };
  public selectedDetail = {
    id: 0,
    accountCode: "",
    bankCode: "",
    balanceInSystem: 0,
    balanceInOnlineBank: 0,
    channelGroup: "",
    accountName: "",
    accountPassword: "",
    usbPassword: "",
    queryPassword: "",
    proxy: ""
  };
  public current = {
    id: "",
    accountCode: "",
    bankCode: "",
    balanceInSystem: 0,
    balanceInOnlineBank: 0,
    accountName: "",
    accountPassword: "",
    queryPassword: "",
    usbPassword: "",
    proxy: "",
    cookie: "",
    session: ""
  };
  public currentDetail = {
    id: 0,
    accountCode: "",
    bankCode: "",
    balanceInSystem: 0,
    balanceInOnlineBank: 0,
    channelGroup: "",
    accountName: "",
    accountPassword: "",
    usbPassword: "",
    queryPassword: "",
    proxy: ""
  };

  @Mutation
  SET_BANK_BALANCE(balance: number) {
    this.currentDetail.balanceInOnlineBank = balance;
  }
  @Action
  async Search(accountCode: string): Promise<{ id: number; code: string, balance:number }[]> {
    var { data } = await AccountApi.getList();
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
    var { data } = await AccountApi.getList();
    var account = (data.data as Array<{ key: number; value: string }>).find(
      account => account.value.indexOf(accountCode) !== -1
    );

    if (!account) throw new Error("Get account id fail");
    return account.key;
  }

  @Action
  async GetProxy(accountId: number): Promise<string> {
    var response = await AccountApi.getAssignedProxy(accountId);
    var data = response.data.data;
    if (data.length === 0) {
      throw new Error("Proxy not assigned to this account");
    }
    var proxy = data[0].value.split("http://")[1];
    return proxy;
  }
  //   @Mutation
  // private   SET_SELECTED_CARD( account:object)  {
  //       this.selected.id = account.id;
  //       this.selected.accountCode = account.accountCode;
  //       this.selected.bankCode = account.bankCode;
  //     }
  //   @Mutation
  //  private   UNSET_SELECTED_CARD() {
  //       this.selected = {};
  //     },
  //     SET_SELECTED_CARD_DETAIL: (
  //       this.
  //       { selectedCard, cardDetail, boBalance, group }
  //     )  {
  //       this.selectedDetail = {
  //         id: selectedCard.id,
  //         accountCode: selectedCard.accountCode,
  //         bankCode: selectedCard.bankCode,
  //         balanceInSystem: boBalance,
  //         balanceInOnlineBank: 0,
  //         channelGroup: group,
  //         proxy: cardDetail.proxy
  //       };
  //     }
  //     SET_SELECTED_CARD_LOGIN_INFO: (
  //       this.
  //       { username, password, usbPassword, queryPassword }
  //     )  {
  //       this.selectedDetail.accountName = username;
  //       this.selectedDetail.accountPassword = password;
  //       this.selectedDetail.usbPassword = usbPassword;
  //       this.selectedDetail.queryPassword = queryPassword;
  //     }
  //     UNSET_SELECTED_CARD_DETAIL: this. {
  //       this.selectedDetail = {};
  //     }
  //     SET_CURRENT_CARD( card)  {
  //       this.current = { ...card };
  //     }
  //     SET_CURRENT_CARD_DETAIL( cardDetail)  {
  //       this.currentDetail = { ...cardDetail };
  //     }
  //     SET_CURRENT_CARD_BO_BALANCE( boBalance)  {
  //       this.currentDetail.balanceInSystem = boBalance;
  //     }
  //     UNSET_CURRENT_CARD: this. {
  //       this.current = {
  //         id: "",
  //         accountCode: "",
  //         bankCode: "",
  //         balanceInSystem: 0,
  //         balanceInOnlineBank: 0,
  //         accountName: "",
  //         accountPassword: "",
  //         queryPassword: "",
  //         usbPassword: "",
  //         proxy: "",
  //         cookie: "",
  //         session: ""
  //       };
  //     }
  //     UNSET_CURRENT_CARD_DETAIL: this. {
  //       this.currentDetail = {};
  //     }
  //   }

  //   actions: {
  //     async SetSelectedCardDetail() {
  //       try {
  //         const selectedCard = getters.card.selected;
  //         var result = await getDetailById(selectedCard.id);
  //         var [getBoBalanceResult, getGroupResult] = await Promise.all([
  //           getBoBalance(selectedCard.id),
  //           getGroup(selectedCard.id)
  //         ]);
  //         commit("SET_SELECTED_CARD_DETAIL", {
  //           selectedCard,
  //           cardDetail: result.data.value.virtualAcct,
  //           boBalance: getBoBalanceResult.data.value[0].availableBalance,
  //           group: getGroupResult.data.value[0].accountGroup.groupName
  //         });
  //         const signInInfo = await getAccountSignInInfo(selectedCard.accountCode);
  //         commit("SET_SELECTED_CARD_LOGIN_INFO", {
  //           username: signInInfo.username,
  //           password: signInInfo.password,
  //           usbPassword: signInInfo.usbPassword,
  //           queryPassword: signInInfo.queryPassword
  //         });
  //         return true;
  //       } catch (error) {
  //         LogModule.SetLog( { message: error, level: "error" });
  //         return false;
  //       }
  //     }
  //     async GetCurrentCardBoBalance() {
  //       try {
  //         const currentCard = getters.card.current;
  //         var getBoBalanceResult = await getBoBalance(currentCard.id);
  //         commit(
  //           "SET_CURRENT_CARD_BO_BALANCE",
  //           getBoBalanceResult.data.value[0].availableBalance
  //         );
  //       } catch (error) {
  //         throw new Error("Get current card bo balance fail");
  //       }
  //     }

  //     // Move selected card to current card
  //     async SetCurrentCard() {
  //       commit("SET_CURRENT_CARD", getters.card.selected);
  //       commit("SET_CURRENT_CARD_DETAIL", getters.card.selectedDetail);
  //       commit("UNSET_SELECTED_CARD");
  //       commit("UNSET_SELECTED_CARD_DETAIL");
  //     }
  //     async UnsetCurrentCard({ commit }) {
  //       commit("UNSET_CURRENT_CARD");
  //     }
  //     // This for unset everything
  //     async UnsetCard({ commit }) {
  //       commit("UNSET_CURRENT_CARD");
  //       commit("UNSET_CURRENT_CARD_DETAIL");
  //       commit("UNSET_SELECTED_CARD");
  //       commit("UNSET_SELECTED_CARD_DETAIL");
  //     }
  //   }
  // };

  // async function getAccountSignInInfo(accountCode) {
  //   try {
  //     var accountID;
  //     var result = await getAccountCodeListInSkypay();
  //     const accountCodeList = result.data.data;
  //     for (let index = 0; index < accountCodeList.length; index++) {
  //       const account = accountCodeList[index];
  //       if (account.value.indexOf(accountCode) !== -1) {
  //         accountID = account.key;
  //         break;
  //       }
  //     }

  //     var accountDetail = await getAccountDetailInSkypay(accountID);
  //     var data = accountDetail.data.data;
  //     return {
  //       username: data.acctUsername,
  //       password: data.acctPassword,
  //       usbPassword: data.acctUSBPass,
  //       queryPassword: data.acctQueryPass
  //     };
  //   } catch (error) {
  //     throw new Error("Get account sign in info fail. Error: " + error);
  //   }
}

export const AccountModule = getModule(Card);
