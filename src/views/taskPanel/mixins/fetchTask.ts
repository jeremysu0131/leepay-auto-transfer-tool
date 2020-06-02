import { Component, Vue, Watch, Mixins } from "vue-property-decorator";
import TaskOperationMixin from "./taskOperation";
import { AppModule } from "@/store/modules/app";
import { WorkerModule } from "@/store/modules/worker";
import WorkerIeStatusResponseModel from "@/workers/models/workerIeStatusResponseModel";
import { WorkflowEnum } from "@/workers/utils/workflowHelper";
import { AccountModule } from "@/store/modules/account";
import { TaskModule } from "@/store/modules/task";
import TaskStatusEnum from "@/enums/taskStatusEnum";
import { LogModule } from "@/store/modules/log";
import dayjs from "dayjs";
import WorkerBalanceResponseModel from "@/workers/models/workerBalanceResponseModel";
@Component
export default class FetchTaskMixin extends Mixins(TaskOperationMixin) {
  public fetchTimer = 9;
  public fetchButton = {
    icon: "el-icon-refresh",
    type: "default"
  };
  private fetchIntervalId!: any;
  private isFetchingTask = false;
  private isProcessingTask = false;
  private refreshPageCounter = 0;

  get appState() {
    return AppModule;
  }
  get task() {
    return TaskModule;
  }
  private isAbleRunInterval(): boolean {
    if (!this.appState.task.isAbleFetch) return false;
    if (this.isFetchingTask) return false;
    return true;
  }
  private isAbleProcessTask(): boolean {
    if (this.isProcessingTask) return false;
    if (this.appState.task.isProcessing) return false;
    return true;
  }
  async initFetchInterval() {
    this.fetchIntervalId = setInterval(async () => {
      if (!this.isAbleRunInterval()) return;

      this.fetchTimer--;

      // Auto process task
      if (this.isAbleProcessTask()) {
        this.isProcessingTask = true;
        try {
          if (this.checkBankCookieExpired()) {
            await this.handleBankCookieExpired();
          } else {
            await this.handleIeStatus();
            await this.handleAutoRowSelect();
          }
        } catch (error) {
          LogModule.SetLog({ level: "error", message: error });
        } finally {
          this.isProcessingTask = false;
        }
      }

      // Fetch task
      if (this.fetchTimer === 0) {
        this.isFetchingTask = true;
        try {
          await this.fetchTasks();
          await this.getBankBalance();
        } catch (error) {
          LogModule.SetLog({ level: "error", message: error });
        } finally {
          this.isFetchingTask = false;
        }
      }
    }, 1 * 1000);
  }
  private async handleBankCookieExpired() {
    if (!this.appState.task.isProcessing) {
      LogModule.SetLog({ level: "warn", message: `${this.handleBankCookieExpired.name} try closing web driver` });
      await this.closeWebDriver();
    }
  }
  private async closeWebDriver() {
    try {
      AppModule.HANDLE_ACCOUNT_SIGN_IN_TO_BANK(false);
      AccountModule.UnsetAccount();
      await WorkerModule.RunFlow({ name: WorkflowEnum.UNSET_WORKER });
      LogModule.SetLog({ level: "info", message: "Close web driver successfully" });
    } catch (error) {
      LogModule.SetLog({ level: "error", message: error });
    }
  }
  async handleIeStatus() {
    if (this.currentAccount.id === 0) return;
    if (this.appState.task.isProcessing) return;

    try {
      let { isIeClosed } = await WorkerModule.RunFlow<WorkerIeStatusResponseModel>({
        name: WorkflowEnum.CHECK_IF_IE_CLOSED
      });
      if (isIeClosed) {
        LogModule.SetLog({ level: "warn", message: "User closed IE, try closing web driver" });
        await this.closeWebDriver();
      }
    } catch (error) {
      LogModule.SetLog({ level: "error", message: error });
      // Check ie state fail, so unset the worker to prevent error
      LogModule.SetLog({ level: "warn", message: `${this.handleIeStatus.name} try closing web driver` });
      await this.closeWebDriver();
    }
  }
  async disposeFetchInterval() {
    clearInterval(this.fetchIntervalId);
  }
  async fetchTasks() {
    try {
      await Promise.all([this.getBoBalance(), this.getTasks()]);
      this.fetchButton.type = "success";
    } catch (error) {
      this.fetchButton.type = "danger";
      LogModule.SetConsole({ level: "error", message: error });
      TaskModule.SET_TASK_LIST([]);
    } finally {
      this.fetchTimer = 9;
    }
  }
  private async getBoBalance() {
    if (this.currentAccount.id) {
      let boBalance = await AccountModule.GetBoBalance(this.currentAccount.id);
      AccountModule.SET_BANK_BO_BALANCE(boBalance);
    }
  }
  private async getBankBalance() {
    this.refreshPageCounter++;

    if (this.isProcessingTask) return;
    if (this.appState.task.isProcessing) return;
    if (!this.appState.account.isSignInToBank) return;
    if (this.task.list.length !== 0) return;
    // Get bank balance each 60s
    if (this.refreshPageCounter < 6) return;

    try {
      AppModule.HANDLE_TASK_PROCESSING(true);
      let workerResponse = await WorkerModule.RunFlow<WorkerBalanceResponseModel>({ name: WorkflowEnum.GET_BALANCE });
      AccountModule.SET_BANK_BALANCE(workerResponse.balance || 0);
    } catch (error) {
      LogModule.SetLog({ level: "error", message: error });
      LogModule.SetLog({ level: "warn", message: `${this.getBankBalance.name} try closing web driver` });
      await this.closeWebDriver();
    } finally {
      AppModule.HANDLE_TASK_PROCESSING(false);
      this.refreshPageCounter = 0;
    }
  }
  private async handleAutoRowSelect() {
    if (!this.appState.task.isAutoProcess) return;
    if (this.appState.task.isProcessing) return;

    let tasks = this.task.list;
    if (tasks.length !== 0) {
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        if (
          task.checkTool.status === TaskStatusEnum.TO_PROCESS ||
          task.checkTool.status === TaskStatusEnum.PROCESSING
        ) {
          await this.handleRowSelect(task);
          break;
        }
      }
    }
  }
  private checkBankCookieExpired(): boolean {
    if (this.currentAccount.code.includes("ABC")) {
      return dayjs().subtract(30, "minute") > dayjs(this.currentAccount.signInSuccessAt);
    }
    return false;
  }
}
