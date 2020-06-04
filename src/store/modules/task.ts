import { VuexModule, Module, Mutation, Action, getModule } from "vuex-module-decorators";
import store from "@/store";
import * as TaskApi from "@/api/task";
import { asyncForEach } from "@/utils/asyncForEach";
import { AppModule } from "./app";
import TaskViewModel from "../../models/taskViewModel";
import { LogModule } from "./log";
import TaskTypeEnum from "../../enums/taskTypeEnum";
import { UserModule } from "./user";
import TaskStatusEnum from "../../enums/taskStatusEnum";
import { AccountModule } from "./account";
import TaskCheckToolModel from "@/models/taskCheckToolModel";
import * as TaskCheckHelper from "@/utils/taskCheckHelper";
import dayjs from "dayjs";
import LeepayTaskStatusEnum from "@/enums/leepayTaskStatusEnum";
import TaskModel from "@/models/taskModel";
import TaskDetailViewModel from "@/models/taskDetailViewModel";

let getStatus = (status: string): LeepayTaskStatusEnum => {
  switch (status) {
    case "I":
      return LeepayTaskStatusEnum.I;
    case "F":
      return LeepayTaskStatusEnum.F;
    case "FC":
      return LeepayTaskStatusEnum.FC;
    case "P":
      return LeepayTaskStatusEnum.P;
    default:
      throw new Error("No such status");
  }
};
export interface ITaskState {
  list: TaskViewModel[];
  lastSelected: TaskDetailViewModel;
  selectedDetail: TaskDetailViewModel;
  selectedForOperation: TaskModel;
}

@Module({ dynamic: true, store, name: "task" })
class Task extends VuexModule implements ITaskState {
  public list = [] as TaskViewModel[];
  public lastSelected = new TaskDetailViewModel();
  public selectedDetail = new TaskDetailViewModel();
  public selectedForOperation = {} as TaskModel;

  @Mutation
  public SET_TASK_LIST(tasks: TaskViewModel[]) {
    this.list = tasks;
  }
  @Mutation
  public SET_LAST_SELECTED_DATA(taskDetail: TaskDetailViewModel) {
    this.lastSelected = taskDetail;
  }
  @Mutation
  public SET_SELECTED_DETAIL(taskDetail: TaskDetailViewModel) {
    this.selectedDetail = taskDetail;
  }
  @Mutation
  public SET_SELECTED_FOR_OPERATION(task: TaskModel) {
    this.selectedForOperation = { ...task };
  }
  @Mutation
  public SET_BANK_CHARGE_FOR_OPERATION(transferFee: number) {
    this.selectedForOperation.newCharge = transferFee;
  }
  @Mutation
  public SET_BANK_REMARK_FOR_OPERATION(remark: string) {
    this.selectedForOperation.remark = remark;
  }
  @Action
  public async GetAll(accountId: number): Promise<TaskViewModel[]> {
    AppModule.HANDLE_TASK_FETCHING(true);
    try {
      let { data } = await TaskApi.getAll(accountId);
      let tasks: TaskViewModel[] = await Promise.all(
        (data.value as [])
          .map((t: any) => {
            let task = new TaskViewModel();
            task.id = t.id;
            task.taskId = t.taskId;
            task.amount = t.amount;
            task.merchant = t.merchantNameString;
            task.status = getStatus(t.status);
            task.assignedAt = dayjs(t.requestTimeStr).toDate();
            task.withdrawId = t.withdraw.id;
            // task.createdAt = dayjs(task.createdAt).format("hh:mm:ss");
            return task;
          })
          .map(async task => {
            let data = await TaskCheckHelper.get(task.id);
            if (data !== null) {
              task.checkTool.id = data.id;
              task.checkTool.status = data.status;
            }
            return task;
          })
      );
      TaskModule.SET_TASK_LIST(tasks);
      return tasks;
    } catch (error) {
      LogModule.SetConsole({ level: "error", message: error });
      return [];
    } finally {
      AppModule.HANDLE_TASK_FETCHING(false);
    }
  }
  @Action
  // taskId is the id in TaskViewModel
  public async GetDetail(task: { id: number; withdrawId: number; amount: number }): Promise<TaskDetailViewModel> {
    try {
      let response = await TaskApi.getDetail(task.id, task.withdrawId);
      const data = response.data.value;
      const taskDetail: TaskDetailViewModel = {
        id: task.id,
        amount: task.amount,
        payeeAccount: {
          bank: {
            chineseName: data.offeredBank.bankChName,
            branch: data.cardBranch,
            city: data.cardCity,
            code: data.offeredBankName,
            province: data.cardProvince
          },
          cardNumber: data.cardNum,
          holderName: data.cardName
        },
        transferFee: 0,
        status: ""
      };

      this.SET_SELECTED_DETAIL(taskDetail);

      return taskDetail;
    } catch (error) {
      LogModule.SetConsole({ level: "error", message: "Get task detail fail" });
      LogModule.SetLog({ level: "error", message: error });
      throw error;
    }
  }

  @Action
  public async GetSelectedTaskDataForApi({
    accountId,
    taskId
  }: {
    accountId: number;
    taskId: number;
  }): Promise<TaskModel> {
    try {
      let { data } = await TaskApi.getAll(accountId);
      return (data.value as TaskModel[]).find(task => task.id === taskId) as TaskModel;
    } catch (error) {
      LogModule.SetLog({ level: "error", message: error });
      throw error;
    }
  }

  @Action
  public async Lock(taskId: number): Promise<boolean> {
    try {
      let { data } = await TaskApi.lock(taskId);
      return data.success;
    } catch (error) {
      LogModule.SetLog({ message: error, level: "error" });
      return false;
    }
  }

  @Action
  async MarkTaskSuccess(task: TaskModel): Promise<boolean> {
    try {
      let { data } = await TaskApi.markTaskSuccess(task);
      return data.success;
    } catch (error) {
      LogModule.SetLog({ level: "error", message: error });
      LogModule.SetConsole({
        level: "error",
        message: "Mark task as success fail, please contact admin"
      });
      return false;
    }
  }
  @Action
  async MarkTaskFail(task: TaskModel): Promise<boolean> {
    LogModule.SetLog({
      level: "debug",
      message: `Mark task fail parameters: reason: ${task.remark}. Processed by ${UserModule.name}`
    });
    try {
      let { data } = await TaskApi.markTaskFail(task);
      return data.success;
    } catch (error) {
      LogModule.SetConsole({ level: "error", message: error });
      LogModule.SetConsole({
        level: "error",
        message: "Mark task as fail failed, please contact admin"
      });
      return false;
    }
  }
  @Action
  public async MoveCurrentTaskToLast(task: TaskDetailViewModel) {
    // Clear selected task
    this.SET_LAST_SELECTED_DATA(task);
    this.SET_SELECTED_DETAIL(new TaskDetailViewModel());
    this.SET_SELECTED_FOR_OPERATION({} as TaskModel);
  }

  @Action
  async UnsetTask() {
    this.SET_TASK_LIST([]);
    this.SET_LAST_SELECTED_DATA(new TaskDetailViewModel());
    this.SET_SELECTED_DETAIL(new TaskDetailViewModel());
    this.SET_SELECTED_FOR_OPERATION({} as TaskModel);
  }
}

export const TaskModule = getModule(Task);
