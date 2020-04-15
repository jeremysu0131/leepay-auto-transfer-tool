
<template>
  <div>
    <div class="card">
      <div
        v-if="selectedCard.accountCode===currentCard.accountCode"
        class="reselect-card"
      >
        <div class="reselect-card__header">
          <span>Reselect Account:</span>
          <span>{{ selectedCard.accountCode|| '' }}</span>
        </div>
        <div class="reselect-card__body">
          <div style="color:#f56c6c">
            Login again with this current account will close previous IE window.
          </div>
          <div>Please choose the method of Login.</div>
          <div>Login process will open a new IE window, please do not close it.</div>
        </div>
      </div>
      <div
        v-if="selectedCard.accountCode!==currentCard.accountCode"
        class="change-card"
      >
        <div class="change-card__header">
          <span>New Account:</span>
          <span>{{ selectedCard.accountCode|| '' }}</span>
        </div>
        <div class="change-card__body">
          <div style="color:#f56c6c">
            Current Account is
            <strong>{{ currentCard.accountCode|| '' }}</strong>, this will close its associated IE window. Any pending tasks of this current account will no longer appear here afterwards.
          </div>
          <div>Please confirm account selected and choose the method of Login.</div>
          <div>Login process will open a new IE window, please do not close it.</div>
        </div>
      </div>
      <div class="card__footer">
        <el-button
          size="small"
          @click="handleManualLogin"
        >
          Manual Login
        </el-button>
        <el-button
          size="small"
          @click="handleAutoLogin"
        >
          Auto Login
        </el-button>
        <el-button
          size="small"
          @click="handleCancel"
        >
          Cancel
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { AccountModule } from "../../../store/modules/account";
import { AppModule } from "../../../store/modules/app";
import { WorkerModule } from "../../../store/modules/worker";
@Component({
  name: "ChangeCard"
})
export default class extends Vue {
  currentAccount() {
    return AccountModule.current;
  }
  selectedAccount() {
    return AccountModule.selected;
  }
  accountStatus() {
    return AppModule.account;
  }

  async handleManualLogin() {
    await this.resetAccountStatus();
    AppModule.HANDLE_MANUAL_LOGIN(true);
    AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("sign-in-to-bank");
    WorkerModule.RunManualLoginFlows();
  }
  async handleAutoLogin() {
    await this.resetAccountStatus();
    AppModule.HANDLE_MANUAL_LOGIN(true);
    AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("sign-in-to-bank");
    WorkerModule.RunAutoLoginFlows();
  }
  handleCancel() {
    AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("account-search");
  }
  async resetAccountStatus() {
   AppModule.HANDLE_TASK_FETCHABLE(false);
   AppModule.HANDLE_ACCOUNT_SIGN_IN_SUCCESS(false);
  }
}
</script>

<style lang="scss">
@import "../../../styles/variables.scss";
.change-card {
  &__header {
    font-size: $fontLarge;
    text-align: center;
    margin: 16px 0;
  }
  &__body {
    div {
      margin: 16px 0;
    }
  }
}
.reselect-card {
  &__header {
    font-size: $fontLarge;
    text-align: center;
    margin: 16px 0;
  }
  &__body {
    div {
      margin: 16px 0;
    }
  }
}
.card {
  padding: 0 64px;
  &__footer {
    text-align: center;
    .el-button {
      width: 130px;
    }
  }
}
</style>
