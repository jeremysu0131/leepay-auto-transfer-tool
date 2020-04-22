<template>
  <div class="task-list__container-body">
    <el-table
      ref="taskTable"
      v-loading="app.task.isFetching"
      :data="taskList"
      style="width: 100%"
      :height="tableHeight"
      size="mini"
      :stripe="true"
      :border="true"
      :row-class-name="selectedRowClass"
      :default-sort="{prop: 'priority', order: 'descending'}"
    >
      <el-table-column
        prop="id"
        label="ID"
        width="80"
        align="center"
      />
      <!-- <el-table-column
        prop="createdAt"
        label="Request Time"
        width="150"
        align="center"
      />-->
      <el-table-column
        prop="pendingTime"
        label="Pending(min.)"
        align="center"
        width="130"
        sortable
      />
      <el-table-column
        prop="priority"
        label="Priority"
        align="center"
        width="90"
        sortable
      />
      <el-table-column
        prop="checkTool.status"
        label="Status"
        align="center"
        width="120"
      />
      <el-table-column
        prop="workflow"
        label="Workflow"
        align="center"
        width="120"
      />
      <!-- FIXME to check if this field correctlly -->
      <!-- <el-table-column
        prop="remitterAccountCode"
        label="From Account"
        align="center"
        width="120"
      />-->
      <!-- FIXME to check if this field correctlly -->
      <el-table-column
        prop="amount"
        label="Amount"
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
      <!-- <el-table-column
        prop="asignee"
        label="Asignee"
        align="center"
      />-->
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
                v-if="isProcessButtonShow(scope.row)"
                class="task-operator__button"
                style="width:80px"
                size="mini"
                :disabled="isProcessButtonDisabled(scope.row)"
                @click="handleRowSelect(scope.row)"
              >
                {{ scope.row.checkTool.status === "processing" ? "Reprocess" : "Process" }}
              </el-button>
              <el-button
                v-if="!isProcessButtonShow(scope.row)"
                class="task-operator__button"
                style="width:80px"
                size="mini"
                type="success"
                :disabled="isSuccessButtonDisabled(scope.row)"
                @click="markTaskAsSuccess(scope.row)"
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
                      type="success"
                      @click="markTaskAsSuccess(scope.row)"
                    >
                      <svg-icon
                        name="check"
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
                      type="danger"
                      @click="markTaskAsFail(scope.row)"
                    >
                      <svg-icon
                        name="error"
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
                      @click="markTaskAsToConfirm(scope.row)"
                    >
                      <svg-icon
                        name="check-circle"
                        class="el-row--popover__el-button--icon"
                      />To Confirm
                    </el-button>
                  </el-col>
                  <!-- <el-col
                    v-if="isReassignButtonVisible(scope.row)"
                    :span="24"
                    class="el-row--popover__el-col"
                  >
                    <el-button
                      class="el-row--popover__el-button"
                      @click="markAsReassign(false, scope.row)"
                    >
                      <svg-icon
                        name="unlock"
                        class="el-row--popover__el-button--icon"
                      />Re-assign
                    </el-button>
                  </el-col>-->
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
import { AccountModule } from "../../../store/modules/account";
import { TaskModule } from "../../../store/modules/task";
import { UserModule } from "../../../store/modules/user";
import { MessageBox } from "element-ui";
import { AppModule } from "@/store/modules/app";
import TaskOperationMixin from "../mixins/taskOperation";
import { LogModule } from "@/store/modules/log";
import TaskModel from "../../../models/taskModel";
import * as TaskCheckHelper from "@/utils/taskCheckHelper";
import TaskOperateEnum from "../../../enums/taskOperateEnum";
import { MessageBoxData } from "element-ui/types/message-box";
import TaskDetailModel from "../../../models/taskDetailModel";
import { WorkerModule } from "@/store/modules/worker";
import TaskStatusEnum from "@/enums/taskStatusEnum";
import { WorkflowEnum } from "@/workers/utils/workflowHelper";

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
  get taskList() {
    return TaskModule.list;
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
  private async markTaskAsSuccess(task: TaskModel) {
    await this.lockTask(task);
    var taskDetail = await TaskModule.GetDetail(task, AccountModule.current.id);
    this.markAsSuccess(taskDetail);
  }
  private async markTaskAsFail(task: TaskModel) {
    await this.lockTask(task);
    var taskDetail = await TaskModule.GetDetail(task, AccountModule.current.id);
    this.markAsFail(taskDetail);
  }
  private async markTaskAsToConfirm(task: TaskModel) {
    await this.lockTask(task);
    var taskDetail = await TaskModule.GetDetail(task, AccountModule.current.id);
    this.markAsToConfirm(taskDetail);
  }
  private selectedRowClass({ row, rowIndex }: any) {
    if (this.selectedTask) {
      if (this.selectedTask.id === row.id) {
        return "executing-row";
      }
    }
    return "";
  }
  private isMoreButtonDisabled(row: TaskModel) {
    if (row.checkTool.status === TaskStatusEnum.TO_PROCESS) return true;
    return false;
  }
  private isProcessButtonShow(row: TaskModel) {
    return row.checkTool.status !== "to-confirm";
  }
  private isProcessButtonDisabled(row: TaskModel) {
    // FIXME
    // else if (this.app.task.isProcessing) return true;
    return false;
  }
  private isSuccessButtonDisabled(row: TaskModel) {
    if (row.checkTool.status !== TaskStatusEnum.TO_CONFIRM) return true;
    return false;
  }
  private isSuccessButtonVisible(row: TaskModel) {
    if (row.checkTool.status === TaskStatusEnum.TO_PROCESS) {
      return false;
    }
    return true;
  }
  private isFailButtonVisible(row: TaskModel) {
    if (row.checkTool.status === TaskStatusEnum.TO_PROCESS) {
      return false;
    }
    return true;
  }
  private isToConfirmButtonVisible(row: TaskModel) {
    if (row.checkTool.status === TaskStatusEnum.PROCESSING) {
      return true;
    }
    return false;
  }
  // private isReassignButtonVisible(row:TaskModel) {
  //   if (row.checkTool.status !== "I") {
  //     return false;
  //   }
  //   return true;
  // }
}
</script>
