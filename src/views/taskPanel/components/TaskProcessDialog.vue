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
        :disabled="true"
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

@Component({ name: "TaskProcessDialog" })
export default class extends Mixins(TaskOperationMixin) {
  get app() {
    return this.$store.state.app;
  }
  @Watch("app.task.isShowCheckProcessDialog")
  onProcessDialogChange() {
    var audio = new Audio(require("@/assets/sounds/alarm.mp3"));
    if (this.app.task.isShowCheckProcessDialog) {
      audio.play();
    }
  }
  private async handleTaskSuccess() {
    this.$store.commit("HANDLE_MARK_AS_SUCCESS_DIALOG", true);
    this.$store.commit("HANDLE_TASK_CHECK_PROCESS_DIALOG", false);
  }
  private async handleTaskFail() {
    this.$store.commit("HANDLE_MARK_AS_FAIL_DIALOG", true);
    this.$store.commit("HANDLE_TASK_CHECK_PROCESS_DIALOG", false);
  }
  // TODO
  private async handleTaskToConfirm() {
    // await this.markAsToConfirm(true, this.selectedTask);
    this.$store.commit("HANDLE_TASK_CHECK_PROCESS_DIALOG", false);
    // this.$store.commit("HANDLE_TASK_PROCESSING", false);
  }
  // private closeDialog() {
  //   this.$store.commit("HANDLE_TASK_HANDLING", false);
  // }
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
