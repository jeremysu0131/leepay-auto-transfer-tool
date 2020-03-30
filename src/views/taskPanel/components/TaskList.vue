<template>
  <div class="task-list__container">
    <div class="task-list__container-header">
      <div class="current-account">
        <span>Current Account:</span>
        <span style="font-weight: bold;">{{ card.currentDetail.accountCode || "" }}</span>
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
    <div class="task-list__container-body">
      <el-table
        ref="taskTable"
        v-loading="app.task.isFetching"
        :data="task.list"
        style="width: 100%"
        :height="tableHeight"
        size="mini"
        :stripe="true"
        :border="true"
        :row-class-name="selectedRowClass"
      >
        <el-table-column
          prop="id"
          label="Task ID"
          width="70"
          align="center"
        />
        <el-table-column
          label="Account Group"
          width="120"
          align="center"
        >
          <!-- eslint-disable-next-line -->
          <template slot-scope="scope">{{ card.currentDetail.channelGroup || " - " }}</template>
        </el-table-column>
        <el-table-column
          prop="merchantNameString"
          label="Merchant"
          align="center"
        />
        <!-- <el-table-column
          prop="receiver"
          label="Receiver"
          align="center"
        />-->
        <el-table-column
          prop="amount"
          label="Amount"
          width="100"
          header-align="center"
          align="right"
        >
          <template
            slot-scope="scope"
          >
            {{ new Intl.NumberFormat("zh-CN", {style: "currency", currency: "CNY"}).format( scope.row.amount) }}
          </template>
        </el-table-column>
        <el-table-column
          label="Leepay Status"
          align="center"
        >
          <template slot-scope="scope">
            <div style="color:#C0C4CC;">
              <span v-if="scope.row.status === 'I'">processing</span>
              <span v-if="scope.row.status === 'P'">paid</span>
              <span v-if="scope.row.status === 'FC'">failed confirmation</span>
              <span v-if="scope.row.status === 'F'">failed</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="toolStatus"
          label="FT Status"
          align="center"
        />
        <el-table-column
          label="Assigned Time"
          align="center"
        >
          <template slot-scope="scope">
            <span style="margin-left: 10px">{{ scope.row.requestTimeStr.split(" ")[1] }}</span>
          </template>
        </el-table-column>
        <!-- <el-table-column
          prop="status"
          label="Process Duration"
          align="center"
          width="80"
        />-->
        <el-table-column
          label="Actions"
          width="160"
          align="center"
          fixed="right"
        >
          <template slot-scope="scope">
            <div style="display: flex; justify-content: space-around">
              <div>
                <el-button
                  v-if="scope.row.toolStatus !== 'to-confirm'"
                  class="task-operator__button"
                  style="width:80px"
                  size="mini"
                  :disabled="isProcessButtonDisabled(scope.row)"
                  @click="handleRowSelect(scope.row)"
                >
                  {{ scope.row.toolStatus === "processing" ? "Reprocess" : "Process" }}
                </el-button>
                <el-button
                  v-if="scope.row.toolStatus === 'to-confirm'"
                  class="task-operator__button"
                  style="width:80px"
                  size="mini"
                  type="success"
                  :disabled="isSuccessButtonDisabled(scope.row)"
                  @click="markAsSuccess(scope.row)"
                >
                  Success
                </el-button>
              </div>
              <div>
                <el-popover
                  :disabled="isMoreButtonDisabled(scope.row)"
                  trigger="click"
                  placement="left"
                  width="180"
                >
                  <el-row class="el-row--popover">
                    <el-col
                      v-if="isSuccessButtonVisible(scope.row)"
                      :span="24"
                      class="el-row--popover__el-col"
                    >
                      <el-button
                        class="el-row--popover__el-button"
                        @click="markAsSuccess(scope.row)"
                      >
                        <svg-icon
                          icon-class="check"
                          class="el-row--popover__el-button--icon"
                        />Success
                      </el-button>
                    </el-col>
                    <el-col
                      v-if="isFailButtonVisible(scope.row)"
                      :span="24"
                      class="el-row--popover__el-col"
                    >
                      <el-button
                        class="el-row--popover__el-button"
                        @click="markAsFail(false, scope.row)"
                      >
                        <svg-icon
                          icon-class="error"
                          class="el-row--popover__el-button--icon"
                        />Fail
                      </el-button>
                    </el-col>
                    <el-col
                      v-show="isToConfirmButtonVisible(scope.row)"
                      :span="24"
                      class="el-row--popover__el-col"
                    >
                      <el-button
                        class="el-row--popover__el-button"
                        @click="markAsToConfirm(false, scope.row)"
                      >
                        <svg-icon
                          icon-class="check-circle"
                          class="el-row--popover__el-button--icon"
                        />To Confirm
                      </el-button>
                    </el-col>
                    <el-col
                      v-if="isReassignButtonVisible(scope.row)"
                      :span="24"
                      class="el-row--popover__el-col"
                    >
                      <el-button
                        class="el-row--popover__el-button"
                        @click="markAsReassign(false, scope.row)"
                      >
                        <svg-icon
                          icon-class="unlock"
                          class="el-row--popover__el-button--icon"
                        />Re-assign
                      </el-button>
                    </el-col>
                  </el-row>
                  <el-button
                    slot="reference"
                    :disabled="isMoreButtonDisabled(scope.row)"
                    class="task-operator__button"
                    size="mini"
                  >
                    More
                  </el-button>
                </el-popover>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <!-- <TaskSuccessDialog /> -->
    <TaskFailDialog />
    <!-- <TaskProcessDialog /> -->
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch, Mixins } from "vue-property-decorator";
import dayjs from "dayjs";
import { TaskFailDialog, TaskProcessDialog, TaskSuccessDialog } from ".";
import { saveTaskStatus } from "../../../utils/persistentState";
import { CardModule } from "../../../store/modules/card";
import { TaskModule } from "../../../store/modules/task";
import { UserModule } from "../../../store/modules/user";
import { MessageBox } from "element-ui";
import { AppModule } from "@/store/modules/app";
import TaskOperationMixin from "../mixins/taskOperation";
// import { getAccountCodeListInSkypay } from "../../../api/card";

@Component({
  name: "TaskList",
  mixins: [TaskOperationMixin],
  components: {
    TaskSuccessDialog,
    TaskFailDialog,
    TaskProcessDialog
  }
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
      if (lastTime < nowTime - 2) {
        this.$store.commit("SET_LOG", {
          level: "error",
          message: `Interval delay, last: ${lastTime}, now: ${nowTime}`
        });
      }
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
          this.$store.commit("MINUS_TASK_FETCH_TIMER");
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
  get card() {
    return CardModule;
  }
  get task() {
    return TaskModule;
  }
  get name() {
    return UserModule.name;
  }
  get selectedTask() {
    return this.task.selected;
  }

  get tableHeight() {
    // top header, tab margin, tab content, info header, task detail, others
    return window.innerHeight - 50 - 16 - 30 - 65 - 198 - 73 - 100;
  }
  get balanceInSystem() {
    if (this.card.currentDetail.balanceInSystem) {
      return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY"
      }).format(this.card.currentDetail.balanceInSystem);
    }
    return "-";
  }
  get balanceInOnlineBank() {
    if (this.card.currentDetail.balanceInOnlineBank) {
      return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY"
      }).format(this.card.currentDetail.balanceInOnlineBank);
    }
    return "-";
  }
  get signInSuccessAt() {
    return dayjs(this.app.account.signInSuccessAt).format("HH:mm:ss");
  }

  @Watch("app.showingTab")
  onShowingTabChanged() {
    if (this.app.showingTab === "tasks") {
      if (this.app.task.isFetchable && !this.app.task.isTaskHandling) { this.handleFetch(); }
    }
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
    if (this.card.current.accountCode.indexOf("ABC") === -1) return;

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
  private selectedRowClass({ row, rowIndex }: any) {
    if (this.selectedTask) {
      if (this.selectedTask.id === row.id) {
        return "executing-row";
      }
    }
    return "";
  }
  private async handleFetch() {
    try {
      await Promise.all([this.getBoBalance(), this.getTasks()]);
      this.fetchButton.type = "success";
    } catch (error) {
      this.fetchButton.type = "danger";
      this.$store.dispatch("SetConsole", { level: "error", message: error });
      return this.$store.commit("SET_TASK_LIST", []);
    } finally {
      this.$store.commit("RESET_TASK_FETCH_TIMER", 9);
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
  private async getTasks() {
    let scrollTop = (this.$refs.taskTable as any).bodyWrapper.scrollTop;
    await this.$store.dispatch("GetAllTasks");
    (this.$refs.taskTable as any).bodyWrapper.scrollTop = scrollTop;
  }
  private async handleRowSelect(val: any) {
    try {
      this.$store.commit("HANDLE_TASK_PROCESSING", true);
      var isLockSuccess = await this.$store.dispatch(
        "LockSelectedTask",
        val.taskId
      );
      if (!isLockSuccess) {
        return this.$store.dispatch("SetConsole", {
          title: "Automation Stopped",
          message:
            "Can not claim the tasks. Task has been assigned.\r\n" +
            "Please claim it manully in order to process it\r\n" +
            'Note: the "auto process task" has been turned off as the result.'
        });
      }

      this.$store.commit("SET_DATA_FOR_API", val);
      this.$store.commit("SET_SELECTED_DATA_FOR_API", val);
      await this.$store.dispatch("GetAndSetSelectedTaskDetail", val);
      await this.$store.dispatch("SetTaskInfomationToTool");
      val.toolStatus = "processing";

      var [isCheckSuccess, result] = await this.$store.dispatch(
        "CheckTaskExecuted"
      );

      if (isCheckSuccess && result.length === 0) {
        // await this.recordExecutingTask(
        //   val.taskId,
        //   "leepay",
        //   "First time run, create by system.",
        //   this.name
        // );
        await this.startTask();
      } else if (isCheckSuccess && result.length > 0) {
        this.$store.commit("HANDLE_TASK_AUTO_PROCESS", false);

        if (this.app.task.isAutoProcess) {
          this.$store.dispatch("SetConsole", {
            title: "Automation Stopped",
            message:
              "Please check the current task status carefully and process it manually\r\n" +
              'Note: the "auto process task" has been turned off as the result.'
          });
        }

        if (await this.confirmExecution(val.taskId, result)) {
          await this.startTask();
        } else {
          this.$store.commit("HANDLE_TASK_PROCESSING", false);
        }
      }
    } catch (error) {
      this.$store.dispatch("SetConsole", { level: "error", message: error });
    }
  }
  // private async unlockTask(task: any) {
  //   try {
  //     await this.$store.dispatch("UnlockSelectedTask", task.taskId);
  //     this.$message({
  //       message: "Task has been unlocked",
  //       type: "success"
  //     });
  //     this.$store.dispatch("SetConsole", {
  //       message: "Task has been unlocked",
  //       level: "info"
  //     });
  //   } catch (error) {
  //     this.$message({
  //       message: error.message,
  //       type: "error"
  //     });
  //     this.$store.dispatch("SetConsole", {
  //       message: error.message,
  //       level: "error"
  //     });
  //   }
  // }
  private async startTask() {
    try {
      if (
        this.card.current.accountCode.indexOf("ABC") > 0 ||
        this.card.current.accountCode.indexOf("ICBC") > 0
      ) {
        var isProcessSuccess = await this.$store.dispatch(
          "RunAutoTransferFlows"
        );

        if (isProcessSuccess) {
          this.$store.commit("HANDLE_TASK_PROCESSING", false);
        } else {
          new Audio(require("@/assets/sounds/alarm.mp3")).play();
          this.$store.commit("HANDLE_TASK_CHECK_PROCESS_DIALOG", true);
        }
      } else {
        await this.$store.dispatch("RunManualTransferFlows");
      }
    } catch (error) {
      this.$store.dispatch("SetConsole", {
        message: error.message,
        level: "error"
      });
    }
  }
  private confirmExecution(taskID: number, executedTasks: any) {
    var message = "Previous executed record:" + "<br>";
    executedTasks.forEach((executedTask: any, index: number) => {
      message +=
        `${index + 1}.` +
        `At <span style="font-weight:bold">${dayjs(
          executedTask.createAt
        ).format("HH:mm:ss")}</span>` +
        `, Note: <span style="font-weight:bold">${executedTask.reason ||
          executedTask.note}</span>` +
        "<br>";
    });
    return MessageBox.prompt(
      message +
        '<span style="color:#E6A23C">Please enter the reason what you want to run this task again:</span>',
      executedTasks.message,
      {
        inputPattern: /\S+/,
        inputErrorMessage: "The reason can't be empty",
        type: "warning",
        dangerouslyUseHTMLString: true
      }
    )
      .then(async({ value }: any) => {
        // await this.recordExecutingTask(taskID, "leepay", value, this.name);
        return true;
      })
      .catch(() => {
        return false;
      });
  }
  // private async recordExecutingTask(
  //   taskID: number,
  //   platform: string,
  //   reason: string,
  //   operator: string
  // ) {
  //   await saveTaskStatus(taskID, platform, reason, operator);
  //   await this.$store.dispatch("CreateTaskExecuteRecord", reason);
  // }
  private isMoreButtonDisabled(row: any) {
    if (row.status !== "I") return true;
    return false;
  }
  private isProcessButtonDisabled(row: any) {
    if (row.status !== "I" || row.toolStatus === "to-confirm") return true;
    else if (this.app.task.isProcessing) return true;
    return false;
  }
  private isSuccessButtonDisabled(row: any) {
    if (row.status !== "I") return true;
    return false;
  }
  private isSuccessButtonVisible(row: any) {
    if (row.toolStatus === "to-process") {
      return false;
    }
    return true;
  }
  private isFailButtonVisible(row: any) {
    if (row.toolStatus === "to-process") {
      return false;
    }
    return true;
  }
  private isToConfirmButtonVisible(row: any) {
    if (row.toolStatus === "processing") {
      return true;
    }
    return false;
  }
  private isReassignButtonVisible(row: any) {
    if (row.status !== "I") {
      return false;
    }
    return true;
  }
}
</script>

<style lang="scss" scoped>
@import "../../../styles/variables.scss";

.task-list {
  &__container {
    &-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 50px;
      margin-bottom: 15px;
      padding: 8px 16px;
      background-color: #f2f2f2;
      border-radius: 4px;

      .current-account {
        font-size: $fontBase;
      }

      .bo-balance {
        font-size: $fontBase;
      }

      .fetch-task {
        text-align: right;
      }
    }

    &-body {
      margin-top: 8px;
      .task-operator__button {
        padding: 6px 8px;
        margin: 0;
      }
    }
  }
}
.el-row--popover {
  &__el-col {
    &:not(:last-child) {
      margin-bottom: 8px;
    }
  }
  &__el-button {
    width: 155px;
    text-align: left;
    &--icon {
      margin-right: 8px;
    }
  }
}
</style>

<style lang="scss">
.el-table .executing-row > td {
  background: rgb(240, 249, 235) !important;
}
</style>
