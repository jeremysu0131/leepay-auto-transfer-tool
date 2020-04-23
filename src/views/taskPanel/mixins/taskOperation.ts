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
import TaskOperateEnum from "@/enums/taskOperateEnum";
import dayjs from "dayjs";
import { MessageBox } from "element-ui";
import soundHelper from "@/utils/soundHelper";
@Component
export default class TaskOperationMixin extends Vue {
  public taskExecutedResult = [] as any[];
  public confirmExecuteMessage = "";
  public async getTasks() {
    // let scrollTop = (this.$refs.taskTable as any).bodyWrapper.scrollTop;
    await TaskModule.GetAll();

    // (this.$refs.taskTable as any).bodyWrapper.scrollTop = scrollTop;
  }
  public async handleRowSelect(task: TaskModel) {
    try {
      AppModule.HANDLE_TASK_PROCESSING(true);

      // Check if task can be claim
      if (await this.lockTask(task)) {
        var taskDetail = await TaskModule.GetDetail(
          task,
          AccountModule.current.id
        );

        if (await this.checkIfTaskExecuted(task, taskDetail)) {
          AppModule.HANDLE_TASK_AUTO_PROCESS(false);
          if (
            await this.confirmBeforeExecute(
              task.checkTool.id,
              this.taskExecutedResult
            )
          ) {
            TaskCheckHelper.createExecuteRecord(
              task.checkTool.id,
              TaskOperateEnum.EXECUTE,
              UserModule.name,
              this.confirmExecuteMessage
            );
            await this.startTask(taskDetail);
          } else {
            AppModule.HANDLE_TASK_PROCESSING(false);
          }
        } else {
          TaskCheckHelper.createExecuteRecord(
            task.checkTool.id,
            TaskOperateEnum.EXECUTE,
            UserModule.name,
            "First time run, create by system."
          );
          await this.startTask(taskDetail);
        }
      }
    } catch (error) {
      LogModule.SetConsole({ level: "error", message: error });
    }
  }
  public async lockTask(task: TaskModel) {
    // check if locked
    if (+task.assigneeId !== +UserModule.id) {
      if (!(await TaskModule.Lock(task.id))) {
        LogModule.SetConsole({
          // title: "Automation Stopped",
          level: "error",
          message:
            "Can not claim the tasks. Task has been assigned.\r\n" +
            "Please claim it manully in order to process it\r\n" +
            'Note: the "auto process task" has been turned off as the result.'
        });
        return false;
      }
    }
    return true;
  }
  private async checkIfTaskExecuted(
    task: TaskModel,
    taskDetail: TaskDetailModel
  ) {
    // check tool id was 0 means not execute
    if (task.checkTool.id === 0) {
      await TaskCheckHelper.create(
        taskDetail,
        AccountModule.current.code,
        UserModule.name
      );
      return false;
    }

    this.taskExecutedResult = await TaskCheckHelper.getExecutedResult(
      task.checkTool.id
    );
    return this.taskExecutedResult.length > 0;
  }
  private confirmBeforeExecute(
    toolId: number,
    executedTasks: Array<{
      id: number;
      taskID: number;
      operateType: string;
      operator: string;
      createAt: Date;
      note: string;
    }>
  ): Promise<boolean> {
    var message = "Previous executed record:" + "<br>";
    executedTasks.forEach((executedTask, index) => {
      message +=
        `${index + 1}.` +
        `At <span style="font-weight:bold">${dayjs(
          executedTask.createAt
        ).format("HH:mm:ss")}</span>` +
        `, Note: <span style="font-weight:bold">${executedTask.note}</span>` +
        "<br>";
    });
    soundHelper.play("danger");
    return (
      MessageBox.prompt(
        message +
          '<span style="color:#E6A23C">Please enter the reason what you want to run this task again:</span>',
        "",
        {
          inputPattern: /\S+/,
          inputErrorMessage: "The reason can't be empty",
          type: "warning",
          dangerouslyUseHTMLString: true
        }
      )
        // @ts-ignore
        .then(({ value }) => {
          this.confirmExecuteMessage = value;
          return true;
        })
        .catch(() => {
          return false;
        })
        .finally(() => {
          soundHelper.stop("danger");
        })
    );
  }
  public async startTask(taskDetail: TaskDetailModel) {
    this.beforeExecuteTask(taskDetail);
    try {
      if (await this.runAutoTransferFlows()) {
        this.handleTransferSuccess();
      } else {
        this.handleTransferFail();
      }
    } catch (error) {
      LogModule.SetLog({ level: "error", message: error });
    }
  }
  private beforeExecuteTask(taskDetail: TaskDetailModel) {
    TaskModule.SET_SELECTED_DETAIL(taskDetail);
    TaskModule.GetAll();
    WorkerModule.SET_TRANSFER_WORKFLOW(AccountModule.current.code);
    AppModule.HANDLE_TASK_PROCESSING(true);
    TaskCheckHelper.updateStatus(
      TaskModule.selectedDetail.id,
      TaskStatusEnum.PROCESSING,
      UserModule.name
    );
  }
  private async runAutoTransferFlows() {
    try {
      await WorkerModule.RunFlow({
        name: WorkflowEnum.SET_TASK,
        args: TaskModule.selectedDetail
      });
      await WorkerModule.RunFlow({ name: WorkflowEnum.GO_TRANSFER_PAGE });
      await WorkerModule.RunFlow({
        name: WorkflowEnum.FILL_TRANSFER_INFORMATION
      });
      await WorkerModule.RunFlow({ name: WorkflowEnum.FILL_NOTE });
      await WorkerModule.RunFlow({ name: WorkflowEnum.CONFIRM_TRANSACTION });
      await WorkerModule.RunFlow({ name: WorkflowEnum.CHECK_IF_SUCCESS });
      return true;
    } catch (error) {
      LogModule.SetLog({ level: "error", message: error });
      // LogModule.SetConsole({
      //   level: "error",
      //   message:
      //     'Error happened during login, please login manually and click "confirm" button below when complete Note: the "auto process task" has been turned off as the result'
      // });
      return false;
    } finally {
      AppModule.HANDLE_ACCOUNT_PROCESSING_SIGN_IN(false);
      // AppModule.HANDLE_TASK_PROCESSING(true);
      TaskModule.SET_SELECTED_FOR_OPERATION(TaskModule.selectedDetail);
    }
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
      AppModule.HANDLE_TASK_PROCESSING(false);
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
