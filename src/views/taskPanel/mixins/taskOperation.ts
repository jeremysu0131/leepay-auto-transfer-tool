import { Component, Vue } from "vue-property-decorator";
import { TaskModule } from "@/store/modules/task";
import { WorkerModule } from "../../../store/modules/worker";
import { LogModule } from "../../../store/modules/log";
import { AccountModule } from "../../../store/modules/account";
import { AppModule } from "../../../store/modules/app";
import TaskDetailViewModel from "@/models/taskDetailViewModel";
import { WorkflowEnum } from "@/workers/utils/workflowHelper";
import TaskStatusEnum from "@/enums/taskStatusEnum";
import * as TaskCheckHelper from "@/utils/taskCheckHelper";
import { UserModule } from "@/store/modules/user";
import TaskModel from "@/models/taskModel";
import TaskOperateEnum from "@/enums/taskOperateEnum";
import dayjs from "dayjs";
import { MessageBox, Message } from "element-ui";
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
        AppModule.HANDLE_TASK_AUTO_PROCESS(false);
        await MessageBox.confirm(
          "BO and bank balance are different, please check before process task<br>" +
            '<span style="color:red">Note: as the result of this error, auto processing will be stopped. Please turn it on again, if needed.</span><br>',
          "Balance incorrect",
          {
            type: "warning",
            confirmButtonText: "OK",
            cancelButtonText: "Cancel",
            dangerouslyUseHTMLString: true
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
    if (!(await TaskModule.Lock(task.taskId))) {
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
    return true;
  }
  private async checkIfTaskExecuted(task: TaskViewModel, taskDetail: TaskDetailViewModel) {
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
    message +=
      '<span style="color:red">Note: as the result of this error, auto processing will be stopped. Please turn it on again, if needed.</span><br>';
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
  public async startTask(taskDetail: TaskDetailViewModel) {
    this.beforeExecuteTask(taskDetail);
    const screenRecorder = new ScreenRecorder(this.currentAccount.code);
    try {
      LogModule.SetLog({ level: "info", message: "Task start" });
      screenRecorder.start();
      let result = await this.runAutoTransferFlows();
      if (result.isSuccess) {
        let task = await TaskModule.GetSelectedTaskDataForApi({
          accountId: this.currentAccount.id,
          taskId: taskDetail.id
        });
        TaskModule.SET_SELECTED_FOR_OPERATION(task);
        TaskModule.SET_BANK_CHARGE_FOR_OPERATION(result.transferFee || 0);
        TaskModule.SET_BANK_REMARK_FOR_OPERATION("Auto process by tool");
        await this.handleAutoMarkTaskSuccess(task);
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
    let actualBoBalance = await this.getActualBoBalance();

    let bankBalance = AccountModule.current.balanceInBank;

    // Compare in cache
    if (bankBalance === actualBoBalance) return true;

    // Compare in system
    let result = await WorkerModule.RunFlow<WorkerBalanceResponseModel>({ name: WorkflowEnum.GET_BALANCE });

    if (result) AccountModule.SET_BANK_BALANCE(result.balance);

    if (result.balance === actualBoBalance) return true;

    LogModule.SetLog({
      level: "warn",
      message: `Bo(${actualBoBalance}) and bank balance(${result.balance}) are not same`
    });
    return false;
  }
  async getActualBoBalance(): Promise<number> {
    let boBalance =
      (
        await AccountModule.GetAccountDetail({
          id: this.currentAccount.id,
          code: this.currentAccount.code
        })
      )?.balance || 0;
    let tasksAmount = 0;
    let tasks = await TaskModule.GetAll(this.currentAccount.id);
    tasks.forEach(task => {
      tasksAmount += task.amount;
    });
    return boBalance + tasksAmount;
  }
  getRealBalance(boBalance: number, selectedTask: TaskViewModel): number {
    // TaskModule.list.forEach(task => {
    //   if (task.remitterAccountCode === selectedTask.remitterAccountCode) {
    // if (task.workflow === TaskTypeEnum.PARTIAL_WITHDRAW) boBalance += task.amount;
    //   }
    // });
    return boBalance;
  }
  async handleAutoMarkTaskSuccess(task: TaskModel) {
    let isSuccess = await TaskModule.MarkTaskSuccess(task);
    if (isSuccess) {
      LogModule.SetLog({
        level: "info",
        message: `Mark task success, amount ${task.amount}, charge: ${task.newCharge}`
      });
      let taskDetail = { ...TaskModule.selectedDetail };
      taskDetail.status = TaskStatusEnum.SUCCESS;
      TaskModule.MoveCurrentTaskToLast(taskDetail);
      AppModule.HANDLE_TASK_PROCESSING(false);
      TaskModule.GetAll(this.currentAccount.id);
    }
  }
  private beforeExecuteTask(taskDetail: TaskDetailViewModel) {
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
  public async handleTransferFail(taskDetail: TaskDetailViewModel) {
    let checkToolResult = await TaskCheckHelper.get(taskDetail.id);
    TaskCheckHelper.createExecuteRecord(
      checkToolResult.id,
      "execute",
      UserModule.name,
      `Task executed error, Id: ${TaskModule.selectedDetail.id} Machine name: ${os.hostname()}`
    );
    await this.setTaskForOperation(taskDetail.id);
    AppModule.HANDLE_TASK_CHECK_PROCESS_DIALOG(true);
  }
  public async unlockTask(task: any) {}
  private async setTaskForOperation(taskId: number) {
    const task = await TaskModule.GetSelectedTaskDataForApi({
      accountId: AccountModule.current.id,
      taskId
    });
    TaskModule.SET_SELECTED_FOR_OPERATION(task);
  }
  public async markAsSuccess(taskId: number) {
    AppModule.HANDLE_TASK_PROCESSING(true);
    await this.setTaskForOperation(taskId);
    AppModule.HANDLE_MARK_AS_SUCCESS_DIALOG(true);
  }
  public async markAsFail(taskId: number) {
    AppModule.HANDLE_TASK_PROCESSING(true);
    await this.setTaskForOperation(taskId);
    AppModule.HANDLE_MARK_AS_FAIL_DIALOG(true);
  }
  public async markAsToConfirm(taskId: number) {
    AppModule.HANDLE_TASK_PROCESSING(true);
    await this.setTaskForOperation(taskId);
    let taskModel = TaskModule.selectedForOperation;
    try {
      await TaskCheckHelper.updateStatus(taskId, TaskStatusEnum.TO_CONFIRM, UserModule.name);
      let taskDetailVM = await TaskModule.GetDetail({
        id: taskModel.id,
        amount: taskModel.amount,
        withdrawId: taskModel.withdraw.id
      });
      taskDetailVM.status = TaskStatusEnum.TO_CONFIRM;
      TaskModule.MoveCurrentTaskToLast(taskDetailVM);
      Message({
        showClose: true,
        message: "Task has been marked as to-confirm",
        type: "success"
      });
    } catch (error) {
      LogModule.SetConsole({ level: "error", message: error });
    } finally {
      TaskModule.GetAll(this.currentAccount.id);
      AppModule.HANDLE_TASK_PROCESSING(false);
    }
  }
  public async markAsReassign(taskId: number) {
    AppModule.HANDLE_TASK_PROCESSING(true);
    await this.setTaskForOperation(taskId);
    TaskModule.SET_BANK_REMARK_FOR_OPERATION("re-assign");
    let taskModel = TaskModule.selectedForOperation;
    console.log(taskModel);
    this.$confirm("Are you sure you want to mark this task as re-assign", "", {
      type: "warning"
    })
      .then(async () => {
        try {
          let taskDetailVM = await TaskModule.GetDetail({
            id: taskModel.id,
            amount: taskModel.amount,
            withdrawId: taskModel.withdraw.id
          });
          await TaskModule.MarkTaskReassign(taskModel);

          TaskModule.MoveCurrentTaskToLast(taskDetailVM);
          Message({
            showClose: true,
            message: "Task has been marked as re-assign",
            type: "success"
          });
        } catch (error) {
          LogModule.SetConsole({ level: "error", message: error });
        } finally {
          AppModule.HANDLE_TASK_PROCESSING(false);
        }
      })
      .catch(() => {})
      .finally(() => {
        TaskModule.GetAll(this.currentAccount.id);
        AppModule.HANDLE_TASK_PROCESSING(false);
      });
  }
}
