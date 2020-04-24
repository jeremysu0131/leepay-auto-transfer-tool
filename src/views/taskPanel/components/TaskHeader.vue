<template>
  <div class="task-list__container-header">
    <div class="current-account">
      <span>Current Account:</span>
      <span style="font-weight: bold;">{{ currentAccount.code || "" }}</span>
    </div>

    <div class="bo-balance">
      <span>BO Balance:</span>
      <span style="font-weight: bold;">{{ balanceInSystem }}</span>
      <span
        v-if="isFetchBoBalanceFail"
        style="color:#F56C6C"
      >
        <svg-icon icon-class="error" />Update Fail
      </span>
    </div>
    <div class="bo-balance">
      <span>Bank Balance:</span>
      <span style="font-weight: bold;">{{ balanceInOnlineBank }}</span>
    </div>
    <div class="bo-balance">
      <span>Bank Sign-In:</span>
      <span style="font-weight: bold;">{{ signInSuccessAt }}</span>
    </div>
    <div class="fetch-task">
      <el-button
        size="mini"
        :icon="fetchButton.icon"
        :type="fetchButton.type"
        :loading="app.task.isFetching"
        :disabled="!app.task.isFetchable"
        @click="handleFetch"
      >
        {{ app.task.fetchTimer }}s
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch, Mixins } from "vue-property-decorator";
import dayjs from "dayjs";
import { AccountModule } from "../../../store/modules/account";
import { TaskModule } from "../../../store/modules/task";
import { UserModule } from "../../../store/modules/user";
import { MessageBox } from "element-ui";
import { AppModule } from "@/store/modules/app";
import TaskOperationMixin from "../mixins/taskOperation";
import { LogModule } from "@/store/modules/log";
import TaskStatusEnum from "../../../enums/taskStatusEnum";

@Component({
  name: "TaskHeader",
  mixins: [TaskOperationMixin]
})
export default class extends Mixins(TaskOperationMixin) {
  private fetchButton = {
    icon: "el-icon-refresh",
    type: "default"
  };
  private fetchInvervalID: any = null;
  private taskHandleType = 2;
  private taskOptionVisible = [];
  private taskDialogVisible = false;
  private isFetchBoBalanceFail = false;
  private isWarnedBankTokenExpire = false;
  private isFetchingTask = false;

  async beforeMount() {
    var refreshPageCounter = 0;
    var lastTime = +dayjs() / 1000;
    this.fetchInvervalID = setInterval(async () => {
      if (
        !this.isFetchingTask &&
        this.app.task.isFetchable &&
        !this.app.account.isProcessingSignIn &&
        this.app.account.isSignInSuccess
      ) {
        // Refresh task list
        if (this.app.task.fetchTimer === 0) {
          await this.handleFetch();
          refreshPageCounter++;

          // Get bank balance each 30s
          if (refreshPageCounter >= 3 && !this.app.task.isProcessing) {
            await this.getBankBalance();
            refreshPageCounter = 0;
          }
        } else {
          AppModule.MINUS_TASK_FETCH_TIMER();
          if (this.checkBankCookieExpired()) {
            if (!this.app.task.isProcessing) {
              this.handleCookieExpired();
            }
          } else {
            // Check if run auto process
            this.handleAutoRowSelect();
          }
        }
      }
    }, 1 * 1000);
  }
  beforeDestroy() {
    clearInterval(this.fetchInvervalID);
  }

  get app() {
    return AppModule;
  }
  get currentAccount() {
    return AccountModule.current;
  }
  get task() {
    return TaskModule;
  }
  get name() {
    return UserModule.name;
  }
  get selectedTask() {
    return this.task.selectedDetail;
  }

  get balanceInSystem() {
    if (this.currentAccount.balance) {
      return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY"
      }).format(this.currentAccount.balance);
    }
    return "-";
  }
  get balanceInOnlineBank() {
    if (this.currentAccount.balanceInBank) {
      return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY"
      }).format(this.currentAccount.balanceInBank);
    }
    return "-";
  }
  get signInSuccessAt() {
    return dayjs(this.app.account.signInSuccessAt).format("HH:mm:ss");
  }

  private handleAutoRowSelect() {
    if (this.app.task.isAutoProcess) {
      var taskLength = this.task.list.length;
      if (taskLength !== 0 && !this.app.task.isProcessing) {
        for (let index = taskLength - 1; index >= 0; index--) {
          const task = this.task.list[index];
          if (
            task.checkTool.status === TaskStatusEnum.TO_PROCESS ||
            task.checkTool.status === TaskStatusEnum.PROCESSING
          ) {
            this.handleRowSelect(task);
            break;
          }
        }
      }
    }
  }
  private async reloginToBank() {
    await this.$store.dispatch("CloseSelenium");
    await this.$store.dispatch("RunAutoReloginFlows");
  }
  private checkBankCookieExpired() {
    if (this.isWarnedBankTokenExpire) return;
    if (this.currentAccount.code.indexOf("ABC") === -1) {
      return (
        dayjs().subtract(30, "minute") > dayjs(this.app.account.signInSuccessAt)
      );
    }
  }
  private handleCookieExpired() {
    if (this.app.task.isAutoProcess) {
      this.$store.commit("HANDLE_TASK_FETCHABLE", false);
      this.reloginToBank();
    } else {
      this.isWarnedBankTokenExpire = true;
      var audio = new Audio(require("@/assets/sounds/notification.mp3"));
      audio.play();
      this.$alert(
        "You will be log out from the bank website, please prepare to re-login the bank",
        "Title",
        {
          type: "warning",
          confirmButtonText: "OK",
          callback: action => {
            audio.pause();
          }
        }
      );
    }
  }
  private async handleFetch() {
    try {
      this.isFetchingTask = true;
      await Promise.all([this.getBoBalance(), this.getTasks()]);
      this.fetchButton.type = "success";
    } catch (error) {
      this.fetchButton.type = "danger";
      LogModule.SetConsole({ level: "error", message: error });
      TaskModule.SET_TASK_LIST([]);
    } finally {
      this.isFetchingTask = false;
      AppModule.RESET_TASK_FETCH_TIMER(9);
    }
  }
  private async getBoBalance() {
    try {
      var detail = await AccountModule.GetAccountDetail(this.currentAccount.id);
      if (detail) AccountModule.SET_BANK_BO_BALANCE(detail.balance);
    } catch (error) {
      this.isFetchBoBalanceFail = true;
      throw error;
    }
  }
  private async getBankBalance() {
    try {
      this.$store.commit("HANDLE_TASK_PROCESSING", true);
      await this.$store.dispatch("GetBankBalance");
    } finally {
      this.$store.commit("HANDLE_TASK_PROCESSING", false);
    }
  }
}
</script>
