<template>
  <div>
    <div class="unselect-card__header">
      <span>Account:</span>
      <span>{{ currentAccount.accountCode|| '' }}</span>
    </div>
    <div
      v-if="!isShowConfirmBlock"
      class="unselect-card"
    >
      <div class="unselect-card__body">
        <div>Are you sure to unselected this account?</div>
        <div>This will close the associated IE window, and any pending tasks of this account will no longer appear on this machine.</div>
      </div>
      <div class="unselect-card__footer">
        <el-button
          size="small"
          @click="handleUnselect"
        >
          Yes, unselect it
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
import { Component, Vue, Watch, Prop } from "vue-property-decorator";
import { AppModule } from "@/store/modules/app";
import { AccountModule } from "@/store/modules/account";
import { WorkerModule } from "../../../store/modules/worker";
import RemitterAccountModel from "../../../models/remitterAccountModel";

@Component({ name: "UnselectCard" })
export default class extends Vue {
  private isShowConfirmBlock = false;
  currentAccount() {
    return AccountModule.current;
  }
  accountStatus() {
    return AppModule.account;
  }
  async handleUnselect() {
    AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("account-search");
    AppModule.HANDLE_TASK_AUTO_PROCESS(false);
    AppModule.HANDLE_ACCOUNT_SIGN_IN_TO_BANK(false);
    AppModule.HANDLE_TASK_TAB_VISIBLE(false);
    AppModule.HANDLE_TASK_ABLE_FETCH(false);

    AccountModule.SET_CURRENT(new RemitterAccountModel());
    await WorkerModule.UnsetWorker();
  }
  handleCancel() {
    AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("account-search");
  }
}
</script>

<style lang="scss">
@import "../../../styles/variables.scss";
.unselect-card {
  padding: 0 64px;
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
  &__footer {
    text-align: center;
    .el-button {
      width: 130px;
    }
  }
}
</style>
<style lang="scss">
.unselect-card-confirm {
  padding: 0 64px;
  &__body {
    div {
      margin: 16px 0;
    }
  }
  &__footer {
    text-align: center;
    .el-button {
      width: 130px;
    }
  }
}
</style>
