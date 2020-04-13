<template>
  <div class="bank-card-search">
    <div class="bank-card-search__body">
      <div class="bank-card-search__prompt">
        Please select the account to use
      </div>
      <el-form
        :model="form"
        :inline="true"
        class="bank-card-search__form"
        label-position="left"
        @submit.native.prevent
      >
        <el-form-item
          label="Bank Code"
          label-width="90px"
        >
          <el-input
            v-model="form.accountCode"
            size="small"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            :loading="isSearchingCard"
            size="small"
            @click="searchCardByBankCode"
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
    <div class="bank-card-search__footer">
      <el-button
        v-if="!currentAccount.accountCode"
        class="bank-card-search__footer-button"
        :loading="isSigningInBank"
        :disabled="!selectedBankCard"
        @click="handleAccountSelect"
      >
        Select
      </el-button>
      <el-button
        v-if="currentAccount.accountCode"
        class="bank-card-search__footer-button"
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
@Component({ name: "BankCardSearch" })
export default class extends Vue {
  private isSearchingCard = false;
  private isSigningInBank = false;
  private selectedBankCard = {} as any;
  private accountList = [] as any;
  private form = {
    accountCode: process.env.NODE_ENV === "development" ? "ICBC" : ""
  };

  // ...mapGetters(["app", "card", "worker"]),
  get app() {
    return AppModule;
  }
  // get card(){
  // }
  // get worker(){
  // }
  currentAccount() {
    return AccountModule.current;
  }
  get tableHeight() {
    // top header, tab margin, tab content, info header, bank search prompt, search, footer, others
    return window.innerHeight - 50 - 16 - 30 - 65 - 74 - 57 - 56 - 30;
  }
  private async searchCardByBankCode() {
    try {
      this.isSearchingCard = true;
      this.accountList = await AccountModule.Search(this.form.accountCode);
    } catch (error) {
      console.log(error);
    } finally {
      this.isSearchingCard = false;
    }
  }
  private async handleAccountSelect() {
    var account = await AccountModule.GetAccountDetail(this.selectedBankCard.id);
    account.proxy = await AccountModule.GetProxy(this.selectedBankCard.id);
    AccountModule.SET_SELECTED(account);

    AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("select-sign-in-type");
    await WorkerModule.SetWorker(account);
  }
  private async handleBankCardChange() {
    // this.$store.commit("SET_SELECTED_CARD", this.selectedBankCard);
    // this.$store.commit("HANDLE_ACCOUNT_SHOWING_PAGE", "change-card");
  }
  private handleSelectedRow(val: any) {
    this.selectedBankCard = val;
  }
}
</script>

<style lang="scss" scoped>
@import "../../../styles/variables.scss";

.bank-card-search {
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
