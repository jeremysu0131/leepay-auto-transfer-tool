import { VuexModule, Module, Mutation, Action, getModule } from "vuex-module-decorators";
import store from "@/store";
import * as TaskApi from "@/api/task";
import { asyncForEach } from "@/utils/asyncForEach";
import { AppModule } from "./app";
import TaskModel from "../../models/taskModel";
import { LogModule } from "./log";
import TaskDetailModel from "@/models/taskDetailModel";
import TaskTypeEnum from "../../enums/taskTypeEnum";
import { UserModule } from "./user";
import TaskStatusEnum from "../../enums/taskStatusEnum";
import { AccountModule } from "./account";
import TaskCheckToolModel from "@/models/taskCheckToolModel";
import LastSelectedTaskDetailModel from "@/models/lastSelectedTaskDetailModel";
import * as TaskCheckHelper from "@/utils/taskCheckHelper";
import dayjs from "dayjs";

export interface ITaskState {
  list: TaskModel[];
  lastSelected: LastSelectedTaskDetailModel;
  selectedDetail: TaskDetailModel;
  selectedForOperation: TaskDetailModel;
}

@Module({ dynamic: true, store, name: "task" })
class Task extends VuexModule implements ITaskState {
  public list = [] as TaskModel[];
  public lastSelected = new LastSelectedTaskDetailModel();
  public selectedDetail = new TaskDetailModel();
  public selectedForOperation = new TaskDetailModel();

  @Mutation
  public SET_TASK_LIST(tasks: TaskModel[]) {
    this.list = tasks;
  }
  @Mutation
  public SET_LAST_SELECTED_DATA(taskDetail: LastSelectedTaskDetailModel) {
    this.lastSelected = taskDetail;
  }
  @Mutation
  public SET_SELECTED_DETAIL(taskDetail: TaskDetailModel) {
    this.selectedDetail = taskDetail;
  }
  @Mutation
  public SET_SELECTED_FOR_OPERATION(taskDetail: TaskDetailModel) {
    this.selectedForOperation = taskDetail;
  }
  @Mutation
  public SET_BANK_CHARGE_FOR_OPERATION(transferFee: number) {
    this.selectedForOperation.transferFee = transferFee;
  }
  @Action
  public async GetAll() {
    AppModule.HANDLE_TASK_FETCHING(true);
    try {
      AccountModule.SET_LIST(await AccountModule.GetAvailableAccount());
      let { data } = await TaskApi.getAll();
      let tasks = await Promise.all(
        (data.data as [])
          .filter((task: any) => task.workflow !== TaskTypeEnum.WITHDRAW_DISTRIBUTION)
          .map((task: any) => {
            switch (task.workflow) {
              case TaskTypeEnum.PARTIAL_WITHDRAW:
                return mappingPartialWithdraw(task);
              case TaskTypeEnum.FUND_TRANSFER:
                return mappingFundTransfer(task);
              default:
                throw new Error("No such task type");
            }
          })
          .filter(
            task => AccountModule.list.filter(account => account.code.includes(task.remitterAccountCode)).length !== 0
          )
          .sort((task, nextTask) => nextTask.priority - task.priority)
          // .filter(
          //   task => task.remitterAccountCode === AccountModule.current.code
          // )
          .map(task => {
            task.createdAt = dayjs(task.createdAt).format("hh:mm:ss");
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
    } catch (error) {
      LogModule.SetConsole({ level: "error", message: error });
      return [];
    } finally {
      AppModule.HANDLE_TASK_FETCHING(false);
    }
  }
  @Action
  public async GetDetail(
    task: TaskModel,
    accountId: number // selected account id
  ): Promise<TaskDetailModel | null> {
    try {
      let data;
      switch (task.workflow) {
        case TaskTypeEnum.FUND_TRANSFER:
          data = (
            await TaskApi.getFundTransferDetail({
              taskId: task.id,
              ref: task.ref
            })
          ).data.data;
          break;
        case TaskTypeEnum.PARTIAL_WITHDRAW:
          data = (
            await TaskApi.getPartialWithdrawDetail({
              taskId: task.id,
              bankId: accountId,
              ref: task.ref
            })
          ).data.data;
          break;

        default:
          throw new Error("No such task type");
      }
      return new TaskDetailModel({
        // Task id and ref will shown error in get detail api
        id: task.id,
        ref: task.ref,
        amount: +data.amount,
        type: task.workflow,
        payeeAccount: {
          bank: {
            branch: data.memberBankBranch,
            city: data.memberBankCity,
            province: data.memberBankProvince,
            chineseName: data.bank
          },
          holderName: data.accountHolderName,
          cardNumber: data.accountNo
        }
      });
    } catch (error) {
      LogModule.SetLog({ level: "error", message: error });
      return null;
    }
  }

  @Action
  public async Lock(taskId: number): Promise<boolean> {
    try {
      let { data } = await TaskApi.lock(taskId);
      return data.code === 1;
    } catch (error) {
      LogModule.SetLog({ message: error, level: "error" });
      return false;
    }
  }

  @Action
  async MarkTaskSuccess({ task, note }: { task: TaskDetailModel; note?: string }): Promise<boolean> {
    try {
      let remitterAccountId = AccountModule.current.id;
      switch (task.type) {
        case TaskTypeEnum.FUND_TRANSFER: {
          let { data } = await TaskApi.markFundTransferTaskSuccess(task, note);
          if (data.code === 1) await TaskApi.updateInputFields(task, `Processed by ${UserModule.name}`);
          return true;
        }
        case TaskTypeEnum.PARTIAL_WITHDRAW: {
          let { data } = await TaskApi.markPartialWithdrawTaskSuccess(task, remitterAccountId, note);
          if (data.code === 1) await TaskApi.updateInputFields(task, `Processed by ${UserModule.name}`);
          return true;
        }
      }
      return false;
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
  async MarkTaskFail({ task, reason }: { task: TaskDetailModel; reason: string }) {
    reason += ` Processed by ${UserModule.name}`;
    LogModule.SetLog({
      level: "debug",
      message: `Mark task fail parameters: reason: ${reason}`
    });
    try {
      switch (task.type) {
        case TaskTypeEnum.FUND_TRANSFER: {
          let { data } = await TaskApi.markFundTransferTaskFail(task, reason);
          if (data.code === 1) {
            await TaskApi.updateInputFields(task, reason);
          }
          break;
        }
        case TaskTypeEnum.PARTIAL_WITHDRAW: {
          let response = await TaskApi.markPartialWithdrawTaskFail(task, AccountModule.current.id, 0, reason);
          if (response.data.code === 1) {
            await TaskApi.updateInputFields(task, reason);
          }
          break;
        }

        default:
          break;
      }
    } catch (error) {
      LogModule.SetConsole({ level: "error", message: error });
      // throw new Error("Mark task as fail error, please contact admin");
    }
  }
  @Action
  public async MoveCurrentTaskToLast(task: LastSelectedTaskDetailModel) {
    // Clear selected task
    this.SET_LAST_SELECTED_DATA(task);
    this.SET_SELECTED_DETAIL(new TaskDetailModel());
    this.SET_SELECTED_FOR_OPERATION(new TaskDetailModel());
  }

  @Action
  async UnsetTask() {
    this.SET_TASK_LIST([]);
    this.SET_LAST_SELECTED_DATA(new LastSelectedTaskDetailModel());
    this.SET_SELECTED_DETAIL(new TaskDetailModel());
    this.SET_SELECTED_FOR_OPERATION(new TaskDetailModel());
  }
}

function mappingPartialWithdraw(task: any) {
  return {
    id: task.id,
    amount: +task.field5,
    assignee: task.asignee,
    assigneeId: task.asigneeId,
    assignedAt: task.asigneeAt,
    bank: {
      id: 0,
      code: "",
      chineseName: ""
    },
    customer: task.customer,
    merchant: task.merchantName,
    checkTool: new TaskCheckToolModel(),
    status: "",
    remitterAccountCode: task.field4,
    payeeAccountCode: "-",
    pendingTime: task.pendingTime,
    priority: task.priority,
    ref: task.ref,
    remark: task.remarks,
    createdAt: task.createdAt,
    createdBy: task.createdBy,
    transferFee: isNaN(task.field8) ? 0 : task.field8,
    updatedAt: task.updatedAt,
    updatedBy: task.updatedBy,
    workflow: task.workflow
  } as TaskModel;
}
function mappingFundTransfer(task: any) {
  return {
    id: task.id,
    amount: +task.field5,
    assignee: task.asignee,
    assigneeId: task.asigneeId,
    assignedAt: task.asigneeAt,
    bank: {
      id: 0,
      code: "",
      chineseName: ""
    },
    checkTool: new TaskCheckToolModel(),
    customer: task.customer,
    merchant: "-",
    status: "",
    remitterAccountCode: task.field7,
    payeeAccountCode: task.toAcct,
    pendingTime: task.pendingTime,
    priority: task.priority,
    ref: task.ref,
    remark: task.remarks,
    createdAt: task.createdAt,
    createdBy: task.createdBy,
    transferFee: isNaN(task.field6) ? 0 : task.field6,
    updatedAt: task.updatedAt,
    updatedBy: task.updatedBy,
    workflow: task.workflow
  } as TaskModel;
}
export const TaskModule = getModule(Task);
