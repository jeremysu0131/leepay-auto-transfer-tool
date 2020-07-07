<template>
  <div class="account-search">
    <div class="account-search__body">
      <div class="account-search__prompt">
        Please select the account to use
      </div>
      <el-form
        :model="form"
        :inline="true"
        class="account-search__form"
        label-position="left"
        @submit.native.prevent
      >
        <el-form-item
          label="Account Code"
          label-width="100px"
        >
          <el-input
            v-model="form.accountCode"
            size="small"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            :loading="isSearchingAccount"
            size="small"
            @click="searchAccountByBankCode"
          >
            Search
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    <div>
      <el-table
        ref="acctCodeTable"
        size="mini"
        :data="tableData"
        style="width: 100%"
        :height="tableHeight"
        highlight-current-row
        border
        @current-change="handleSelectedRow"
      >
        <el-table-column
          prop="code"
          label="Account"
        />
        <el-table-column
          prop="balance"
          label="Balance"
        />
        <el-table-column
          prop="bank.bankName"
          label="Channel Group"
        />
      </el-table>
    </div>
    <div class="account-search__footer">
      <el-button
        v-if="!currentAccount.accountCode"
        class="account-search__footer-button"
        :loading="isSigningInBank"
        :disabled="!selectedAccount || !selectedAccount.id"
        @click="handleAccountSelect"
      >
        Select
      </el-button>
      <el-button
        v-if="currentAccount.accountCode"
        class="account-search__footer-button"
        :loading="isSigningInBank"
        :disabled="!selectedAccount"
        @click="handleBankCardChange"
      >
        <span v-if="!selectedAccount">Change</span>
        <span v-if="selectedAccount && currentAccount.accountCode !== selectedAccount.accountCode">Change</span>
        <span v-if="selectedAccount && currentAccount.accountCode === selectedAccount.accountCode">Reselect</span>
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
import { LogModule } from "../../../store/modules/log";
import { MessageBox } from "element-ui";
import AccountViewModel from "../../../models/accountModel";

@Component({ name: "AccountSearch" })
export default class extends Vue {
  private tableData = [] as AccountViewModel[];
  private isSearchingAccount = false;
  private isSigningInBank = false;
  private selectedAccount = {} as AccountViewModel;
  private form = {
    accountCode: process.env.NODE_ENV === "development" ? "5.ABC.301" : ""
  };

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
  async searchAccountByBankCode() {
    try {
      this.isSearchingAccount = true;
      let accountList = await AccountModule.GetAccountList();
      this.tableData = accountList.filter(account => account.code.indexOf(this.form.accountCode) !== -1);
    } catch (error) {
      LogModule.SetLog({ level: "error", message: error });
    } finally {
      this.isSearchingAccount = false;
    }
  }
  private async handleAccountSelect() {
    let account = await AccountModule.GetAccountDetail({ id: this.selectedAccount.id, code: this.selectedAccount.code });
    if (account) {
      AccountModule.SET_SELECTED(account);
      await WorkerModule.SetWorker(account);
      AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("select-sign-in-type");
    } else {
      MessageBox.alert("Get account detail fail", {
        type: "error"
      });
    }
  }
  private handleSelectedRow(val: any) {
    this.selectedAccount = val;
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
