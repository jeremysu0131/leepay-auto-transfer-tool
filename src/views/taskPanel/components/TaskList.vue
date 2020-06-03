<template>
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
    <el-table-column
      label="Account Group"
      width="110"
      align="center"
    >
      <template>{{ currentAccount.group || " - " }}</template>
    </el-table-column>
    <el-table-column
      prop="merchant"
      label="Merchant"
      align="center"
    />
    <el-table-column
      prop="amount"
      label="Amount"
      width="80"
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
      width="100"
    >
      <template slot-scope="scope">
        <div style="color:#C0C4CC;">
          <span>{{ scope.row.status }}</span>
        </div>
      </template>
    </el-table-column>
    <el-table-column
      prop="checkTool.status"
      label="FT Status"
      align="center"
    />
    <el-table-column
      label="Assigned Time"
      align="center"
    >
      <template slot-scope="scope">
        <span
          style="margin-left: 10px"
          v-text="formatDate(scope.row.assignedAt)"
        />
      </template>
    </el-table-column>
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
              width="200"
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
import { WorkerModule } from "@/store/modules/worker";
import TaskStatusEnum from "@/enums/taskStatusEnum";
import { WorkflowEnum } from "@/workers/utils/workflowHelper";
import TaskViewModel from "../../../models/taskViewModel";

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
  get currentAccount() {
    return AccountModule.current;
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
    return window.innerHeight - 50 - 16 - 30 - 65 - 198 - 73 - 70;
    // return window.innerHeight - 300;
  }
  private formatDate(date: Date) {
    return dayjs(date).format("HH:mm:ss");
  }
  private async markTaskAsSuccess(task: TaskViewModel) {
    if (await this.lockTask(task)) this.markAsSuccess(task.id);
  }
  private async markTaskAsFail(task: TaskViewModel) {
    if (await this.lockTask(task)) this.markAsFail(task.id);
  }
  private async markTaskAsToConfirm(task: TaskViewModel) {
    await this.lockTask(task);
    let taskDetail = await TaskModule.GetDetail(task);
    if (taskDetail) this.markAsToConfirm(taskDetail);
  }
  private selectedRowClass({ row, rowIndex }: any) {
    if (this.selectedTask) {
      if (this.selectedTask.id === row.id) {
        return "executing-row";
      }
    }
    return "";
  }
  private isMoreButtonDisabled(row: TaskViewModel) {
    if (row.checkTool.status === TaskStatusEnum.TO_PROCESS) return true;
    return false;
  }
  private isProcessButtonShow(row: TaskViewModel) {
    return row.checkTool.status !== "to-confirm";
  }
  private isProcessButtonDisabled(row: TaskViewModel) {
    if (this.app.task.isProcessing) return true;
    return false;
  }
  private isSuccessButtonDisabled(row: TaskViewModel) {
    if (row.checkTool.status !== TaskStatusEnum.TO_CONFIRM) return true;
    return false;
  }
  private isSuccessButtonVisible(row: TaskViewModel) {
    if (row.checkTool.status === TaskStatusEnum.TO_PROCESS) {
      return false;
    }
    return true;
  }
  private isFailButtonVisible(row: TaskViewModel) {
    if (row.checkTool.status === TaskStatusEnum.TO_PROCESS) {
      return false;
    }
    return true;
  }
  private isToConfirmButtonVisible(row: TaskViewModel) {
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
