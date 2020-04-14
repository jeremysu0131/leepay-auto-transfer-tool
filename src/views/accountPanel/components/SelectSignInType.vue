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

    <el-dialog
      title="Login Flow"
      :visible.sync="dialogVisible"
      :before-close="handleClose"
    >
      <workflow v-if="dialogVisible" />
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { AccountModule } from "../../../store/modules/account";
import { AppModule } from "../../../store/modules/app";
import { WorkerModule } from "../../../store/modules/worker";
import signInTypeMixins from "../mixins/signInType";
import Workflow from "@/components/Workflow/index.vue";

@Component({
  name: "SelectSignInType",
  components: {
    Workflow
  }
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
  signInAutomatically() {
    WorkerModule.SET_AUTO_SIGN_IN_WORKFLOW();
    // this.dialogVisible = true;
    AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("sign-in-to-bank");
    // AppModule.HANDLE_MANUAL_LOGIN(false);
    // AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("sign-in-to-bank");
    // WorkerModule.RunAutoLoginFlows();
  }
  signInManually() {
    AppModule.HANDLE_MANUAL_LOGIN(true);
    WorkerModule.SET_MANUAL_SIGN_IN_WORKFLOW();
    AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("sign-in-to-bank");
    WorkerModule.RunManualLoginFlows();
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
