<template>
  <div class="select-sign-in-type">
    <div class="select-sign-in-type__title">
      <span>Account: {{ selectedAccount.code }}</span>
    </div>
    <div class="select-sign-in-type__body">
      <div class="select-sign-in-type__body-prompt">
        <span>
          Balance:{{ selectedAccount.balance?
            new Intl.NumberFormat('zh-CN', {style: 'currency' ,currency: 'CNY'}).format(
              selectedAccount.balance ) :'-' }},
        </span>
        <span>Channel Group: {{ selectedAccount.channelGroup||'N/A' }}</span>
      </div>
      <div class="select-sign-in-type__body-prompt">
        Please confirm account selected and choose the method of Login.
      </div>
      <div class="select-sign-in-type__body-prompt">
        Login process will open a new IE window,please do not close it.
      </div>
    </div>
    <div class="select-sign-in-type__button-group">
      <el-button
        size="small"
        @click="signInManually"
      >
        Manual Login
      </el-button>
      <el-button
        size="small"
        :disabled="isSignInAutomaticallyDisable()"
        @click="signInAutomatically"
      >
        Auto Login
      </el-button>
      <el-button
        size="small"
        @click="cancel"
      >
        Cancel
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { AccountModule } from "../../../store/modules/account";
import { AppModule } from "../../../store/modules/app";
import signInTypeMixins from "../mixins/signInType";
import { WorkerModule } from "@/store/modules/worker";

@Component({
  name: "SelectSignInType"
})
export default class extends Vue {
  private dialogVisible = false;
  private get app() {
    return AppModule;
  }
  private get selectedAccount() {
    return AccountModule.selected;
  }
  private get worker() {
    return WorkerModule;
  }

  handleClose() {
    this.dialogVisible = false;
  }
  private isSignInAutomaticallyDisable() {
    if (AccountModule.selected.code.indexOf("PSBC") !== -1) {
      return true;
    }
    return false;
  }
  signInAutomatically() {
    AppModule.HANDLE_MANUAL_LOGIN(false);
    AppModule.HANDLE_TASK_AUTO_PROCESS(true);
    AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("sign-in-to-bank");
  }
  signInManually() {
    AppModule.HANDLE_MANUAL_LOGIN(true);
    AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("sign-in-to-bank");
  }

  cancel() {
    AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("account-search");
  }
}
</script>

<style lang="scss" scoped>
@import "../../../styles/variables.scss";

.select-sign-in-type {
  &__title {
    font-size: $fontLarge;
    text-align: center;
  }
  &__body {
    &-prompt {
      font-size: $fontBase;
      margin: 16px 0;
      text-align: center;
    }
  }
  &__button-group {
    margin: 32px 0 0;
    text-align: center;
  }
  &__footer {
    margin-top: 16px;
    text-align: center;
    &-button {
      width: 33%;
    }
  }
}
</style>
