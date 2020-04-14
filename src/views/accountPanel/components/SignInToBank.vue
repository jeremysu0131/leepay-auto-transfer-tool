<template>
  <div class="sign-in-to-bank__container">
    <div class="sign-in-to-bank__title">
      Account: {{ accountCode }}
    </div>
    <div class="sign-in-to-bank__message">
      <span>Please wait for the initialization to complete and then manually login</span>
    </div>
    <workflow />
    <div class="sign-in-to-bank__message">
      <span :style="{color: checkResult.type==='error'?'#F56C6C':''}">{{ checkResult.message }}</span>
    </div>
    <div class="sign-in-to-bank__operator-buttons">
      <el-button
        size="small"
        :loading="isChecking"
        :style="{display: app.isManualLogin?'':'none'}"
        @click="checkIsSignedIn"
      >
        {{ isFirstTimeCheck?'Confirm Logged In':'Check again' }}
      </el-button>
      <el-button
        v-if="!isFirstTimeCheck"
        size="small"
        @click="ignoreCheck"
      >
        Skip checking, I have logged in
      </el-button>
      <el-button
        size="small"
        :disabled="app.account.isProcessingSignIn"
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
import Workflow from "@/components/Workflow/index.vue";
import { AppModule } from "../../../store/modules/app";
import { WorkerModule } from "@/store/modules/worker";
import RemitterAccountModel from "@/models/remitterAccountModel";
@Component({
  name: "SignInToBank",
  components: {
    Workflow
  }
})
export default class extends Vue {
  checkResult = {
    type: "",
    message: "Please click confirm button below after login"
  };
  isFirstTimeCheck = true;
  isChecking = false;

  async mounted() {
    if (AppModule.isManualLogin) {
      WorkerModule.SET_MANUAL_SIGN_IN_WORKFLOW();
      WorkerModule.RunManualLoginFlows();
    } else {
      WorkerModule.SET_AUTO_SIGN_IN_WORKFLOW();
      WorkerModule.RunAutoLoginFlows();
    }
  }

  get app() {
    return AppModule;
  }
  get accountCode() {
    return AccountModule.selected.code;
  }
  get tableHeight() {
    return window.innerHeight - 60 - 60 - 60 - 120 - 2;
  }
  async checkIsSignedIn() {
    this.isChecking = true;
    this.checkResult.type = "";
    this.checkResult.message = "Checking login status, please wait ...";
    if (await this.$store.dispatch("CheckIfLoginSuccess")) {
      this.$message({ type: "success", message: "You have already loggin" });
      this.handleSignInSuccess();
    } else {
      this.checkResult.type = "error";
      this.checkResult.message =
        "Fail to verify login status, are you sure login is completed successfully?";
    }
    this.isChecking = false;
    this.isFirstTimeCheck = false;
  }
  ignoreCheck() {
    this.$confirm(
      "This will ignore the checking method. Continue?",
      "Warning",
      {
        confirmButtonText: "OK",
        cancelButtonText: "Cancel",
        type: "warning"
      }
    )
      .then(() => {
        this.handleSignInSuccess();
      })
      .catch(() => {});
  }
  handleSignInSuccess() {
    AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("account-search");
    AppModule.HANDLE_ACCOUNT_SIGN_IN_SUCCESS(true);
    AppModule.SET_SIGN_IN_SUCCESS_TIME(new Date());

    AppModule.HANDLE_TASK_VISIBLE(true);
    AppModule.HANDLE_TASK_FETCHABLE(true);
    AppModule.HANDLE_SHOWING_TAB("tasks");
    AccountModule.SET_CURRENT(AccountModule.selected);
    AccountModule.SET_SELECTED(new RemitterAccountModel());
    // AccountModule.set("SetCurrentCard");
  }
  cancel() {
    this.$store.commit("HANDLE_ACCOUNT_SHOWING_PAGE", "account-search");
  }
}
</script>

<style lang="scss" scoped>
@import "../../../styles/variables.scss";

.sign-in-to-bank {
  &__title {
    text-align: center;
    font-size: $fontLarge;
  }
  &__message {
    text-align: center;
    font-size: $fontBase;
    margin: 8px 0;
  }
  &__operator-buttons {
    margin: 16px 0 0;
    text-align: center;
  }
}
</style>
