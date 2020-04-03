<template>
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
        label="ID"
        width="90"
        align="center"
      />
      <el-table-column
        prop="createdAt"
        label="Request Time"
        width="140"
        align="center"
      />
      <el-table-column
        prop="pendingTime"
        label="Pending(min.)"
        align="center"
        width="110"
      />
      <el-table-column
        prop="workflow"
        label="Workflow"
        align="center"
        width="120"
      />
      <!-- FIXME to check if this field correctlly -->
      <el-table-column
        prop="remitterAccountCode"
        label="From Account"
        align="center"
        width="120"
      />
      <!-- FIXME to check if this field correctlly -->
      <el-table-column
        prop="amount"
        label="Amount"
        width="90"
        header-align="center"
        align="right"
      >
        <template
          slot-scope="scope"
        >
          {{ new Intl.NumberFormat("zh-CN", {style: "currency", currency: "CNY"}).format(scope.row.amount) }}
        </template>
      </el-table-column>
      <!-- FIXME to check if this field correctlly -->
      <el-table-column
        prop="transferFee"
        label="Bank Charge"
        width="100"
        header-align="center"
        align="right"
      >
        <template
          slot-scope="scope"
        >
          {{ new Intl.NumberFormat("zh-CN", {style: "currency", currency: "CNY"}).format(scope.row.transferFee) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="asignee"
        label="Asignee"
        align="center"
      />
      <el-table-column
        label="Actions"
        align="center"
        width="140"
        fixed="right"
      >
        <template slot-scope="scope">
          <div style="display: flex; justify-content: space-around">
            <div>
              <el-button
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
</template>

<script lang="ts">
import { Component, Vue, Watch, Mixins } from "vue-property-decorator";
import dayjs from "dayjs";
import { saveTaskStatus } from "../../../utils/persistentState";
import { AccountModule } from "../../../store/modules/account";
import { TaskModule } from "../../../store/modules/task";
import { UserModule } from "../../../store/modules/user";
import { MessageBox } from "element-ui";
import { AppModule } from "@/store/modules/app";
import TaskOperationMixin from "../mixins/taskOperation";
import { LogModule } from "@/store/modules/log";
import TaskModel from "../../../models/taskModel";

@Component({
  name: "TaskList",
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

  get app() {
    return AppModule;
  }
  get card() {
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

  get tableHeight() {
    // top header, tab margin, tab content, info header, task detail, others
    return window.innerHeight - 50 - 16 - 30 - 65 - 198 - 73 - 100;
    // return window.innerHeight - 300;
  }
  private selectedRowClass({ row, rowIndex }: any) {
    if (this.selectedTask) {
      if (this.selectedTask.id === row.id) {
        return "executing-row";
      }
    }
    return "";
  }
  private async lockTask(task: TaskModel) {
    console.log(task.assigneeId, UserModule.id);
    if (task.assigneeId !== UserModule.id) {
      if (!(await TaskModule.Lock(task.id))) {
        return LogModule.SetConsole({
          // title: "Automation Stopped",
          level: "error",
          message:
            "Can not claim the tasks. Task has been assigned.\r\n" +
            "Please claim it manully in order to process it\r\n" +
            'Note: the "auto process task" has been turned off as the result.'
        });
      }
    }
  }
  private async handleRowSelect(task: TaskModel) {
    try {
      AppModule.HANDLE_TASK_PROCESSING(true);
      // await this.lockTask(task);
      var taskDetail = await this.getTaskDetail(task);
      TaskModule.SET_SELECTED_DETAIL(taskDetail);
      await this.startTask();
    } catch (error) {
      LogModule.SetConsole({ level: "error", message: error });
    }
  }
  private async getTaskDetail(task: TaskModel) {
    var accountId = await AccountModule.GetId(task.remitterAccountCode);
    var taskDetail = await TaskModule.GetDetail(task, accountId);
    taskDetail.remitterAccount.proxy = await AccountModule.GetProxy(accountId);
    return taskDetail;
  }
  private isMoreButtonDisabled(row: any) {
    if (row.status !== "I") return true;
    return false;
  }
  private isProcessButtonDisabled(row: any) {
    // if (row.status !== "I" || row.toolStatus === "to-confirm") return true;
    // else if (this.app.task.isProcessing) return true;
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
