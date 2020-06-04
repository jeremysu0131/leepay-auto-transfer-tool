<template>
  <el-dialog
    title="Please check transfer result"
    :visible="app.task.isShowCheckProcessDialog"
    width="80%"
    :show-close="false"
  >
    <div>Sorry, system can get the transaction result successfully, Please check the result manually.</div>
    <div
      slot="footer"
      class="dialog-footer"
    >
      <el-button
        type="success"
        size="small"
        @click="handleTaskSuccess"
      >
        Success
      </el-button>
      <el-button
        type="danger"
        size="small"
        @click="handleTaskFail"
      >
        Fail
      </el-button>
      <el-button
        size="small"
        @click="handleTaskToConfirm"
      >
        To Confirm
      </el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { Component, Vue, Watch, Mixins } from "vue-property-decorator";
import TaskOperationMixin from "../mixins/taskOperation";
import { TaskModule } from "../../../store/modules/task";
import { LogModule } from "../../../store/modules/log";
import { AppModule } from "../../../store/modules/app";

@Component({ name: "TaskProcessDialog" })
export default class extends Mixins(TaskOperationMixin) {
  get app() {
    return AppModule;
  }
  get selectedTaskDetail() {
    return TaskModule.selectedDetail;
  }
  @Watch("app.task.isShowCheckProcessDialog")
  onProcessDialogChange() {
    let audio = new Audio(require("@/assets/sounds/alarm.mp3"));
    if (this.app.task.isShowCheckProcessDialog) {
      audio.play();
    }
  }
  private async handleTaskSuccess() {
    this.markAsSuccess(this.selectedTaskDetail.id);
    AppModule.HANDLE_TASK_CHECK_PROCESS_DIALOG(false);
  }
  private async handleTaskFail() {
    this.markAsFail(this.selectedTaskDetail.id);
    AppModule.HANDLE_TASK_CHECK_PROCESS_DIALOG(false);
  }
  private async handleTaskToConfirm() {
    await this.markAsToConfirm(TaskModule.selectedDetail.id);
    AppModule.HANDLE_TASK_CHECK_PROCESS_DIALOG(false);
  }
}
</script>
<style lang="scss" scoped>
.dialog-footer {
  text-align: center;

  .el-button {
    width: 120px;
  }
}
</style>
