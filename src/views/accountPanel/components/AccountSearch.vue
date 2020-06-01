<template>
  <div class="account-search">
    <div class="account-search__body">
      <div class="account-search__prompt">
        Please select the account to use
      </div>
    </div>
    <div>
      <el-table
        ref="acctCodeTable"
        v-loading="app.account.isFetching"
        size="mini"
        :data="accountList"
        style="width: 100%"
        :height="tableHeight"
        highlight-current-row
        border
        @current-change="handleSelectedRow"
      >
        <el-table-column
          prop="code"
          label="Account Code"
        />
        <el-table-column
          prop="balance"
          label="Balance"
        >
          <template
            slot-scope="scope"
          >
            {{ new Intl.NumberFormat("zh-CN", {style: "currency", currency: "CNY"}).format(scope.row.balance) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="account-search__footer">
      <el-button
        v-if="!currentAccount.accountCode"
        class="account-search__footer-button"
        :loading="isSigningInBank"
        :disabled="!selectedBankCard.id"
        @click="handleAccountSelect"
      >
        Select
      </el-button>
      <el-button
        v-if="currentAccount.accountCode"
        class="account-search__footer-button"
        :loading="isSigningInBank"
        :disabled="!selectedBankCard"
        @click="handleBankCardChange"
      >
        <span v-if="!selectedBankCard">Change</span>
        <span v-if="selectedBankCard && currentAccount.accountCode !== selectedBankCard.accountCode">Change</span>
        <span v-if="selectedBankCard && currentAccount.accountCode === selectedBankCard.accountCode">Reselect</span>
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from "vue-property-decorator";
import { AppModule } from "@/store/modules/app";
import { AccountModule } from "../../../store/modules/account";
import RemitterAccountModel from "../../../models/remitterAccountModel";
import { WorkerModule } from "../../../store/modules/worker";

@Component({ name: "AccountSearch" })
export default class extends Vue {
  private isSearchingCard = false;
  private isSigningInBank = false;
  private selectedBankCard = {} as any;
  private form = {
    accountCode: process.env.NODE_ENV === "development" ? "PSS_ICBC_003" : ""
  };

  async mounted() {
    let accountList = await AccountModule.GetAvailableAccount();
    AccountModule.SET_LIST(accountList);
  }
  get app() {
    return AppModule;
  }
  get accountList() {
    return AccountModule.list;
  }
  get currentAccount() {
    return AccountModule.current;
  }
  get tableHeight() {
    // top header, tab margin, tab content, info header, bank search prompt, search, footer, others
    return window.innerHeight - 50 - 16 - 30 - 65 - 74 - 57 - 56 - 30;
  }
  private async handleAccountSelect() {
    let account = await AccountModule.GetAccountDetail(
      this.selectedBankCard.id
    );
    if (account) {
      account.proxy = await AccountModule.GetProxy(this.selectedBankCard.id);
      AccountModule.SET_SELECTED(account);

      await WorkerModule.SetWorker(account);
      AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("select-sign-in-type");
    }
  }
  private handleSelectedRow(val: any) {
    this.selectedBankCard = val;
  }
}
</script>

<style lang="scss" scoped>
@import "../../../styles/variables.scss";

.account-search {
  &__body {
    font-size: $fontBase;
  }
  &__prompt {
    font-size: $fontBase;
    text-align: center;
    // FIXME:
    margin: 58px 0 0;
  }
  &__footer {
    margin-top: 16px;
    text-align: center;
    &-button {
      width: 33%;
    }
  }
}

.el-form {
  margin: 8px 0;
  &-item {
    margin: 0;
  }
}
</style>
