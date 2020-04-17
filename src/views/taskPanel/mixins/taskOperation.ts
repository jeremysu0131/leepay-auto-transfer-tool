import { Component, Vue } from "vue-property-decorator";
import { TaskModule } from "@/store/modules/task";
import { WorkerModule } from "../../../store/modules/worker";
import { LogModule } from "../../../store/modules/log";
import { AccountModule } from "../../../store/modules/account";
import { AppModule } from "../../../store/modules/app";
import TaskDetailModel from "@/models/taskDetailModel";
@Component
export default class TaskOperationMixin extends Vue {
  public async getTasks() {
    // let scrollTop = (this.$refs.taskTable as any).bodyWrapper.scrollTop;
    await TaskModule.GetAll();
    // (this.$refs.taskTable as any).bodyWrapper.scrollTop = scrollTop;
  }
  public async startTask() {
    WorkerModule.SET_TRANSFER_WORKFLOW(AccountModule.current.code);
    AppModule.HANDLE_TASK_PROCESSING(true);
    var isSuccess = await WorkerModule.RunAutoTransferFlows();
    TaskModule.SET_SELECTED_FOR_OPERATION(TaskModule.selectedDetail);
    if (isSuccess) {
      // TODO Get transfer fee
      // TaskModule.MarkTaskSuccess({
      //   task: TaskModule.selectedForOperation,
      //   transferFee: 0
      // });
      AppModule.HANDLE_TASK_PROCESSING(false);
    } else {
      TaskModule.SET_SELECTED_FOR_OPERATION(TaskModule.selectedDetail);
      AppModule.HANDLE_TASK_CHECK_PROCESS_DIALOG(true);
    }
  }
  // private async loginToBankWebsite() {
  //   try {
  //     var taskDetail = TaskModule.selectedDetail;
  //     const { remitterAccount } = taskDetail;
  //     await WorkerModule.SetWorker(remitterAccount);
  //     if (
  //       remitterAccount.code.indexOf("ABC") > 0 ||
  //       remitterAccount.code.indexOf("ICBC") > 0
  //     ) {
  //       var isProcessSuccess = await WorkerModule.RunAutoLoginFlows();

  //       if (isProcessSuccess) {
  //         this.$store.commit("HANDLE_TASK_PROCESSING", false);
  //       } else {
  //         this.$store.commit("HANDLE_TASK_CHECK_PROCESS_DIALOG", true);
  //       }
  //       return isProcessSuccess;
  //     } else {
  //       await WorkerModule.RunManualLoginFlows();
  //     }
  //   } catch (error) {
  //     LogModule.SetConsole({ message: error.message, level: "error" });
  //     return false;
  //   }
  // }
  public async unlockTask(task: any) {
    // try {
    //   await this.$store.dispatch("UnlockSelectedTask", task.taskId);
    //   this.$message({
    //     message: "Task has been unlocked",
    //     type: "success"
    //   });
    //   this.$store.dispatch("SetConsole", {
    //     message: "Task has been unlocked",
    //     level: "info"
    //   });
    // } catch (error) {
    //   this.$message({
    //     message: error.message,
    //     type: "error"
    //   });
    //   this.$store.dispatch("SetConsole", {
    //     message: error.message,
    //     level: "error"
    //   });
    // }
  }
  public async markAsSuccess(task: TaskDetailModel) {
    AppModule.HANDLE_TASK_HANDLING(true);
    TaskModule.SET_SELECTED_FOR_OPERATION(task);
    AppModule.HANDLE_MARK_AS_SUCCESS_DIALOG(true);
  }
  public async markAsFail(task: TaskDetailModel) {
    AppModule.HANDLE_TASK_HANDLING(true);
    TaskModule.SET_SELECTED_FOR_OPERATION(task);
    AppModule.HANDLE_MARK_AS_FAIL_DIALOG(true);
  }
  public confirmMarkAsFail(isHandleCurrentTask: any) {
    // return this.$prompt("Please enter the reason what you want to mark this task as fail.", "", {
    //   inputPattern: /\S+/,
    //   inputErrorMessage: "The reason can't be empty"
    // })
    //   .then(async({ value }) => {
    //     await this.$store.dispatch("MarkTaskFail", { isHandleCurrentTask, reason: value });
    //     this.$message({
    //       showClose: true,
    //       message: "Task has been marked as fail",
    //       type: "success"
    //     });
    //     return true;
    //   })
    //   .catch(() => {
    //     return false;
    //   });
  }
  public async markAsToConfirm(isHandleCurrentTask: any, task: any) {
    // this.isHandlingToConfirm = true;
    // this.$store.commit("HANDLE_TASK_HANDLING", true);
    // try {
    //   await this.$store.dispatch("MarkTaskToConfirm", { isHandleCurrentTask, taskID: task.id });
    // } finally {
    //   this.isHandlingToConfirm = false;
    // }
  }
  public async markAsReassign(isHandleCurrentTask: any, task: any) {
    //   this.$store.commit("HANDLE_TASK_HANDLING", true);
    //   if (task) {
    //     this.$store.commit("SET_DATA_FOR_API", task);
    //   } else {
    //     const selectedDataForAPI = this.$store.state.task.selectedDataForAPI;
    //     this.$store.commit("SET_DATA_FOR_API", selectedDataForAPI);
    //   }
    //   this.$confirm("Are you sure you want to mark this task as re-assign", "", {
    //     type: "warning"
    //   })
    //     .then(async() => {
    //       try {
    //         if (!isHandleCurrentTask) await this.lockTask(task);
    //         await this.$store.dispatch("MarkTaskFail", {
    //           isHandleCurrentTask,
    //           reason: "re-assign"
    //         });
    //         this.$message({
    //           showClose: true,
    //           message: "Task has been marked as re-assign",
    //           type: "success"
    //         });
    //       } catch (error) {
    //         return this.$store.dispatch("SetConsole", {
    //           message: error.toString(),
    //           level: "error"
    //         });
    //       } finally {
    //         this.$store.commit("HANDLE_TASK_HANDLING", false);
    //       }
    //     })
    //     .catch(() => {
    //       this.$store.commit("HANDLE_TASK_HANDLING", false);
    //     });
    // }
  }
}
