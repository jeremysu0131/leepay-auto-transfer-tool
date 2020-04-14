<template>
  <div class="task-list__container-header">
    <div class="current-account">
      <span>Current Account:</span>
      <span style="font-weight: bold;">{{ account.current.code || "" }}</span>
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
// import { getAccountCodeListInSkypay } from "../../../api/card";

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

  async beforeMount() {
    var refreshPageCounter = 0;
    var lastTime = +dayjs() / 1000;
    this.fetchInvervalID = setInterval(async() => {
      /// Start check if interval delay
      var nowTime = +dayjs() / 1000;
      // if (lastTime < nowTime - 2) {
      //   LogModule.SetLog({
      //     level: "error",
      //     message: `Interval delay, last: ${lastTime}, now: ${nowTime}`
      //   });
      // }
      lastTime = nowTime;
      /// End check if interval delay

      if (this.app.task.isFetchable && !this.app.account.isProcessingSignIn) {
        // Refresh task list
        if (this.app.task.fetchTimer === 0) {
          await this.handleFetch();
          refreshPageCounter++;

          // Get bank balance each 30s
          if (
            refreshPageCounter >= 3 &&
            !this.app.task.isProcessing &&
            this.app.account.isSignInSuccess
          ) {
            // This for keep skypay session
            // getAccountCodeListInSkypay();
            await this.getBankBalance();
            refreshPageCounter = 0;
          }
        } else {
          // this.$store.commit("MINUS_TASK_FETCH_TIMER");
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
  get account() {
    return AccountModule;
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
    if (this.account.current.balance) {
      return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY"
      }).format(this.account.current.balance);
    }
    return "-";
  }
  get balanceInOnlineBank() {
    if (this.account.current.balanceInBank) {
      return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY"
      }).format(this.account.current.balanceInBank);
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
          // if (task.toolStatus === "to-process" || task.toolStatus === "processing") {
          //   this.handleRowSelect(task);
          //   break;
          // }
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
    if (this.account.current.code.indexOf("ABC") === -1) return;

    return (
      dayjs().subtract(30, "minute") > dayjs(this.app.account.signInSuccessAt)
    );
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
      await this.getTasks();
      // await Promise.all([this.getBoBalance(), this.getTasks()]);
      this.fetchButton.type = "success";
    } catch (error) {
      this.fetchButton.type = "danger";
      LogModule.SetConsole({ level: "error", message: error });
      TaskModule.SET_TASK_LIST([]);
    } finally {
      AppModule.RESET_TASK_FETCH_TIMER(9);
    }
  }
  private async getBoBalance() {
    try {
      await this.$store.dispatch("GetCurrentCardBoBalance");
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
