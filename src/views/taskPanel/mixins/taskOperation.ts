import { Component, Vue } from "vue-property-decorator";
import { TaskModule } from "@/store/modules/task";
import { WorkerModule } from "../../../store/modules/worker";
import { LogModule } from "../../../store/modules/log";
import { AccountModule } from "../../../store/modules/account";
import { AppModule } from "../../../store/modules/app";
import TaskDetailModel from "@/models/taskDetailModel";
import { WorkflowEnum } from "@/workers/utils/workflowHelper";
import TaskStatusEnum from "@/enums/taskStatusEnum";
import * as TaskCheckHelper from "@/utils/taskCheckHelper";
import { UserModule } from "@/store/modules/user";
import TaskModel from "@/models/taskModel";
@Component
export default class TaskOperationMixin extends Vue {
  public async getTasks() {
    // let scrollTop = (this.$refs.taskTable as any).bodyWrapper.scrollTop;
    await TaskModule.GetAll();

    // (this.$refs.taskTable as any).bodyWrapper.scrollTop = scrollTop;
  }
  public async handleTransferSuccess() {
    await TaskModule.MarkTaskSuccess({
      task: TaskModule.selectedForOperation
    });
    AppModule.HANDLE_TASK_PROCESSING(false);
  }
  public async handleTransferFail() {
    TaskModule.SET_SELECTED_FOR_OPERATION(TaskModule.selectedDetail);
    AppModule.HANDLE_TASK_CHECK_PROCESS_DIALOG(true);
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
  public markAsSuccess(taskDetail: TaskDetailModel) {
    AppModule.HANDLE_TASK_HANDLING(true);
    TaskModule.SET_SELECTED_FOR_OPERATION(taskDetail);
    AppModule.HANDLE_MARK_AS_SUCCESS_DIALOG(true);
  }
  public markAsFail(taskDetail: TaskDetailModel) {
    AppModule.HANDLE_TASK_HANDLING(true);
    TaskModule.SET_SELECTED_FOR_OPERATION(taskDetail);
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
  public async markAsToConfirm(taskDetail: TaskDetailModel) {
    AppModule.HANDLE_TASK_HANDLING(true);
    TaskModule.SET_SELECTED_FOR_OPERATION(taskDetail);
    try {
      await TaskCheckHelper.updateStatus(
        taskDetail.id,
        TaskStatusEnum.TO_CONFIRM,
        UserModule.name
      );
      TaskModule.MoveCurrentTaskToLast({
        ...taskDetail,
        status: TaskStatusEnum.TO_CONFIRM
      });
    } catch (error) {
      LogModule.SetConsole({ level: "error", message: error });
    } finally {
      await TaskModule.GetAll();
      TaskModule.GetAll();
      AppModule.HANDLE_TASK_HANDLING(true);
    }
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
