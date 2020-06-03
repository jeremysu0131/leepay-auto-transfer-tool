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
import RemitterAccountModel from "@/models/remitterAccountModel";
import os from "os";
import WorkerTransferFeeResponseModel from "@/workers/models/workerTransferFeeResponseModel";
import WorkerBalanceResponseModel from "@/workers/models/workerBalanceResponseModel";
import TaskTypeEnum from "@/enums/taskTypeEnum";
import ScreenRecorder from "@/utils/ScreenRecorder";
import TaskViewModel from "@/models/taskViewModel";
@Component
export default class TaskOperationMixin extends Vue {
  public taskExecutedResult = [] as any[];
  public confirmExecuteMessage = "";

  public get currentAccount() {
    return AccountModule.current;
  }
  public async getTasks() {
    // let scrollTop = (this.$refs.taskTable as any).bodyWrapper.scrollTop;
    await TaskModule.GetAll(this.currentAccount.id);

    // (this.$refs.taskTable as any).bodyWrapper.scrollTop = scrollTop;
  }
  private accountSignInFinish(): Promise<boolean> {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (AccountModule.current.id !== 0) {
          resolve(true);
          clearInterval(interval);
        }

        // If selected has been unset, return false
        if (AccountModule.selected.id === 0) {
          resolve(false);
        }
      }, 500);
    });
  }
  public async handleRowSelect(task: TaskViewModel) {
    try {
      AppModule.HANDLE_TASK_PROCESSING(true);

      // Check if task can be claim
      if (!(await this.lockTask(task))) {
        AppModule.HANDLE_TASK_PROCESSING(false);
        return;
      }

      let taskDetail = await TaskModule.GetDetail(task);
      if (!taskDetail) {
        AppModule.HANDLE_TASK_PROCESSING(false);
        return;
      }

      // Check balance before run task
      if (!(await this.checkIfBalanceEqual(task))) {
        new Audio(require("@/assets/sounds/alarm.mp3")).play();
        let isConfirmProcess = false;

        await MessageBox.confirm(
          "BO and bank balance are different, please check before process task",
          "Balance incorrect",
          {
            type: "warning",
            confirmButtonText: "OK",
            cancelButtonText: "Cancel"
          }
        )
          .then(() => {
            isConfirmProcess = true;
          })
          .catch(() => {
            isConfirmProcess = false;
            AppModule.HANDLE_TASK_PROCESSING(false);
          });
        if (!isConfirmProcess) {
          AppModule.HANDLE_TASK_PROCESSING(false);
          return;
        }
      }

      if (await this.checkIfTaskExecuted(task, taskDetail)) {
        if (await this.confirmBeforeExecute(task.checkTool.id, this.taskExecutedResult)) {
          TaskCheckHelper.createExecuteRecord(
            task.checkTool.id,
            TaskOperateEnum.EXECUTE,
            UserModule.name,
            this.confirmExecuteMessage
          );
          await this.startTask(taskDetail);
        } else {
          AppModule.HANDLE_TASK_PROCESSING(false);
          return;
        }
      } else {
        let checkToolResult = await TaskCheckHelper.get(taskDetail.id);
        TaskCheckHelper.createExecuteRecord(
          checkToolResult.id,
          TaskOperateEnum.EXECUTE,
          UserModule.name,
          "First time run, create by system."
        );
        await this.startTask(taskDetail);
      }
    } catch (error) {
      LogModule.SetConsole({ level: "error", message: error });
      AppModule.HANDLE_TASK_PROCESSING(false);
    }
  }
  public async lockTask(task: TaskViewModel) {
    // check if locked
    if (+task.assigneeId !== +UserModule.id) {
      if (!(await TaskModule.Lock(task.id))) {
        LogModule.SetConsole({
          // title: "Automation Stopped",
          level: "error",
          message:
            "Can not claim the tasks. Task has been assigned.\r\n" +
            "Please claim it manually in order to process it\r\n" +
            'Note: the "auto process task" has been turned off as the result.'
        });
        return false;
      }
    }
    return true;
  }
  private async checkIfTaskExecuted(task: TaskViewModel, taskDetail: TaskDetailModel) {
    // check tool id was 0 means not execute
    if (task.checkTool.id === 0) {
      await TaskCheckHelper.create(task, taskDetail, AccountModule.current.code, UserModule.name);
      return false;
    }

    this.taskExecutedResult = await TaskCheckHelper.getExecutedResult(task.checkTool.id);
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
    let message = "Previous executed record:" + "<br>";
    executedTasks.forEach((executedTask, index) => {
      message +=
        `${index + 1}.` +
        `At <span style="font-weight:bold">${dayjs(executedTask.createAt).format("HH:mm:ss")}</span>` +
        `, Note: <span style="font-weight:bold">${executedTask.note}</span>` +
        "<br>";
    });
    soundHelper.play("danger");
    return (
      MessageBox.prompt(
        message + '<span style="color:#E6A23C">Please enter the reason what you want to run this task again:</span>',
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
    const screenRecorder = new ScreenRecorder(this.currentAccount.code);
    try {
      LogModule.SetLog({ level: "info", message: "Task start" });
      screenRecorder.start();
      let result = await this.runAutoTransferFlows();
      if (result.isSuccess) {
        taskDetail.transferFee = result.transferFee || 0;
        await this.handleAutoMarkTaskSuccess(taskDetail);
      } else {
        this.handleTransferFail(taskDetail);
      }
    } catch (error) {
      LogModule.SetLog({ level: "error", message: error });
    } finally {
      screenRecorder.stop();
    }
  }
  async checkIfBalanceEqual(selectedTask: TaskViewModel) {
    let boBalance = this.currentAccount.balance;
    let realBalance = this.getRealBalance(boBalance, selectedTask);

    // Compare in cache
    if (realBalance === this.currentAccount.balanceInBank) return true;

    // Compare in system
    let [detail, result] = await Promise.all([
      AccountModule.GetAccountDetail(this.currentAccount),
      WorkerModule.RunFlow<WorkerBalanceResponseModel>({
        name: WorkflowEnum.GET_BALANCE
      })
    ]);

    if (detail) AccountModule.SET_BANK_BO_BALANCE(detail.balance);
    if (result) AccountModule.SET_BANK_BALANCE(result.balance);

    realBalance = this.getRealBalance(boBalance, selectedTask);
    if (realBalance === this.currentAccount.balanceInBank) return true;

    LogModule.SetLog({
      level: "warn",
      message: `Bo(${realBalance}) and bank balance(${this.currentAccount.balanceInBank}) are not same`
    });
    return false;
  }
  getRealBalance(boBalance: number, selectedTask: TaskViewModel): number {
    TaskModule.list.forEach(task => {
      if (task.remitterAccountCode === selectedTask.remitterAccountCode) {
        // if (task.workflow === TaskTypeEnum.PARTIAL_WITHDRAW) boBalance += task.amount;
      }
    });
    return boBalance;
  }
  async handleAutoMarkTaskSuccess(taskDetail: TaskDetailModel) {
    let isSuccess = await TaskModule.MarkTaskSuccess({ task: taskDetail, note: "Auto process by tool" });
    if (isSuccess) {
      LogModule.SetLog({
        level: "info",
        message: `Mark task success, amount ${taskDetail.amount}, charge: ${taskDetail.transferFee}`
      });
      TaskModule.MoveCurrentTaskToLast({
        ...taskDetail,
        status: TaskStatusEnum.SUCCESS
      });
      AppModule.HANDLE_TASK_PROCESSING(false);
      TaskModule.GetAll(this.currentAccount.id);
    }
  }
  private beforeExecuteTask(taskDetail: TaskDetailModel) {
    TaskModule.SET_SELECTED_DETAIL(taskDetail);
    WorkerModule.SET_TRANSFER_WORKFLOW(AccountModule.current.code);
    TaskModule.GetAll(this.currentAccount.id);
    TaskCheckHelper.updateStatus(TaskModule.selectedDetail.id, TaskStatusEnum.PROCESSING, UserModule.name);
  }
  private async runAutoTransferFlows(): Promise<{ isSuccess: boolean; transferFee?: number }> {
    try {
      await WorkerModule.RunFlow({
        name: WorkflowEnum.SET_ACCOUNT_BO_BALANCE,
        args: { balance: this.currentAccount.balance }
      });
      await WorkerModule.RunFlow({ name: WorkflowEnum.SET_TASK, args: TaskModule.selectedDetail });
      await WorkerModule.RunFlow({ name: WorkflowEnum.GO_TRANSFER_PAGE });
      await WorkerModule.RunFlow({ name: WorkflowEnum.FILL_TRANSFER_INFORMATION });
      await WorkerModule.RunFlow({ name: WorkflowEnum.FILL_NOTE });
      await WorkerModule.RunFlow({ name: WorkflowEnum.CONFIRM_TRANSACTION });

      let flowResult = await WorkerModule.RunFlow<WorkerTransferFeeResponseModel>({
        name: WorkflowEnum.CHECK_IF_SUCCESS
      });
      return { isSuccess: true, transferFee: flowResult.transferFee || 0 };
    } catch (error) {
      LogModule.SetLog({ level: "error", message: `Transfer fail, error: ${error}` });
      return { isSuccess: false };
    }
  }
  public async handleTransferFail(taskDetail: TaskDetailModel) {
    let checkToolResult = await TaskCheckHelper.get(taskDetail.id);
    TaskCheckHelper.createExecuteRecord(
      checkToolResult.id,
      "execute",
      UserModule.name,
      `Task executed error, Id: ${TaskModule.selectedDetail.id} Machine name: ${os.hostname()}`
    );
    this.setTaskForOperation(taskDetail.id);
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
  private async setTaskForOperation(taskId: number) {
    const task = await TaskModule.GetSelectedTaskDataForApi({
      accountId: AccountModule.current.id,
      taskId
    });
    TaskModule.SET_SELECTED_FOR_OPERATION(task);
  }
  public markAsSuccess(taskDetail: TaskDetailModel) {
    AppModule.HANDLE_TASK_PROCESSING(true);
    this.setTaskForOperation(taskDetail.id);
    AppModule.HANDLE_MARK_AS_SUCCESS_DIALOG(true);
  }
  public markAsFail(taskDetail: TaskDetailModel) {
    AppModule.HANDLE_TASK_PROCESSING(true);
    this.setTaskForOperation(taskDetail.id);
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
    AppModule.HANDLE_TASK_PROCESSING(true);
    this.setTaskForOperation(taskDetail.id);
    try {
      await TaskCheckHelper.updateStatus(taskDetail.id, TaskStatusEnum.TO_CONFIRM, UserModule.name);
      TaskModule.MoveCurrentTaskToLast({
        ...taskDetail,
        status: TaskStatusEnum.TO_CONFIRM
      });
    } catch (error) {
      LogModule.SetConsole({ level: "error", message: error });
    } finally {
      TaskModule.GetAll(this.currentAccount.id);
      AppModule.HANDLE_TASK_PROCESSING(false);
    }
  }
  public async markAsReassign(isHandleCurrentTask: any, task: any) {
    //   this.$store.commit("HANDLE_TASK_PROCESSING", true);
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
    //         this.$store.commit("HANDLE_TASK_PROCESSING", false);
    //       }
    //     })
    //     .catch(() => {
    //       this.$store.commit("HANDLE_TASK_PROCESSING", false);
    //     });
    // }
  }
}
