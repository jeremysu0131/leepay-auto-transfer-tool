import {
  VuexModule,
  Module,
  Mutation,
  Action,
  getModule
} from "vuex-module-decorators";
import store from "@/store";
import * as TaskApi from "@/api/task";
import { asyncForEach } from "@/utils/asyncForEach";
import { AppModule } from "./app";
import TaskModel from "../../models/taskModel";
import { LogModule } from "./log";
import TaskDetailModel from "@/models/taskDetailModel";
import TaskTypeEnum from "../../enums/taskTypeEnum";
import { UserModule } from "./user";

export interface ITaskState {
  list: TaskModel[];
  lastSelected: {};
  selectedDetail: TaskDetailModel;
  selectedForOperation: TaskDetailModel;
}

@Module({ dynamic: true, store, name: "task" })
class Task extends VuexModule implements ITaskState {
  public list = [] as TaskModel[];
  public lastSelected = {};
  public selectedDetail = new TaskDetailModel();
  public selectedForOperation = new TaskDetailModel();

  @Mutation
  public SET_TASK_LIST(tasks: TaskModel[]) {
    this.list = tasks;
  }
  @Mutation
  public SET_LAST_SELECTED_DATA(taskDetail: TaskDetailModel) {
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
  // actions: {
  @Action
  public async GetAll() {
    AppModule.HANDLE_TASK_FETCHING(true);
    try {
      var { data } = await TaskApi.getAll();
      var tasks = (data.data as []).map((task: any) => {
        switch (task.workflow) {
          case "Partial Withdraw":
            return {
              id: task.id,
              amount: task.field5,
              assignee: task.asignee,
              assigneeId: task.asigneeId,
              assignedAt: task.asigneeAt,
              bank: {
                id: 0,
                code: "",
                chineseName: ""
              },
              remitterAccountCode: task.field4,
              payeeAccountCode: "",
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
            };
          case "Fund Transfer":
            return {
              id: task.id,
              amount: task.field5,
              assignee: task.asignee,
              assigneeId: task.asigneeId,
              assignedAt: task.asigneeAt,
              bank: {
                id: 0,
                code: "",
                chineseName: ""
              },
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
            };
          default:
            throw new Error("No such task type");
        }
      });
      this.SET_TASK_LIST(tasks);
    } catch (error) {
      throw new Error("Get all tasks fail");
    } finally {
      AppModule.HANDLE_TASK_FETCHING(false);
    }
  }
  @Action
  public async GetDetail(
    task: TaskModel,
    accountId: number
  ): Promise<TaskDetailModel> {
    try {
      var response = await TaskApi.getDetail({
        taskId: task.id,
        bankId: accountId,
        ref: task.ref
      });
      var { data } = response.data;

      return new TaskDetailModel({
        // Task id and ref will shown error in get detail api
        id: task.id,
        ref: task.ref,
        amount: data.amount,
        type: task.workflow,
        remitterAccount: {
          balance: data.accountBalance,
          loginName: data.companyAccountLoginName,
          loginPassword: data.loginPassword,
          code: data.companyBankAccountCode,
          usbPassword: data.usbPassword,
          proxy: ""
        },
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
      throw new Error(error);
    }
  }

  @Action
  public async Lock(taskId: number): Promise<boolean> {
    try {
      var { data } = await TaskApi.lock(taskId);
      return data.code === 1;
    } catch (error) {
      LogModule.SetLog({ message: error, level: "error" });
      return false;
    }
  }

  @Action
  public async GetSelectedTaskDetail(data: {
    id: number;
    withdraw: any;
    amount: number;
    merchantNameString: string;
    requestTimeStr: any;
  }) {
    // const taskId = data.id;
    // const withdrawId = withdraw.id;
    // var result = await getTaskDetail(taskId, withdrawId);
    // const data = result.data.value;
    // var taskDetail = {
    //   id: taskId,
    //   merchantName: merchantNameString,
    //   requestAmount: amount,
    //   requestTime: requestTimeStr,
    //   receiverName: data.cardName,
    //   bank: {
    //     chineseName: data.offeredBank.bankChName,
    //     englishName: data.offeredBank.bankEnName,
    //     branch: data.cardBranch,
    //     province: data.cardProvince,
    //     city: data.cardCity,
    //     cardNumber: data.cardNum
    //   }
    // };
    // commit("SET_SELECTED_DATA", taskDetail);
  }

  @Action
  async MarkTaskSuccess({
    task,
    transferFee,
    note
  }: {
    task: TaskDetailModel;
    transferFee: number;
    note: string;
  }) {
    LogModule.SetLog({
      level: "debug",
      message: `Mark task success parameters: charge: ${transferFee}`
    });
    try {
      switch (task.type) {
        case TaskTypeEnum.FUND_TRANSFER:
          var { data } = await TaskApi.markFundTransferTaskSuccess(
            task,
            transferFee,
            note
          );
          if (data.code === 1) {
            await TaskApi.updateInputFields(
              task,
              transferFee,
              `Processed by ${UserModule.name}`
            );
          }
          break;
        case TaskTypeEnum.PARTIAL_WITHDRAW:
          // var response = await TaskApi.markFundTransferTaskSuccess(task, note);
          // if (response.data.code === 1) { }
          break;

        default:
          break;
      }
    } catch (error) {
      console.log(error);
    }

    // LogModule.SetLog( {
    //   level: "info",
    //   message: `Mark task success response: ${JSON.stringify(result.data)}`
    // });

    // if (result.data.success) {
    //   await this.MoveCurrentTaskToLast", {
    //     isHandleCurrentTask,
    //     status: "success"
    //   });
    //   await this.GetAllTasks");
    // } else {
    //   throw new Error("Mark task as success fail, please contact admin");
    // }
  }
}
//   async SetTaskInfomationToTool() {
//     const taskID = getters.task.dataForAPI.id;
//     const platform = getters.app.platform;
//     var taskInformation = await getTaskFromToolByID(taskID, platform);
//     if (!taskInformation.data) {
//       taskInformation = await createTaskToTool({
//         taskID: taskID,
//         platform: platform,
//         merchant: getters.task.dataForAPI.merchantNameString,
//         cardCode: getters.task.dataForAPI.bankAcctCode,
//         amount: getters.task.selected.requestAmount,
//         payee: getters.task.selected.receiverName,
//         payeeBank: getters.task.selected.bank.englishName,
//         payeeAccount: getters.task.selected.bank.cardNumber,
//         operator: getters.name,
//         status: "processing",
//         remark: "Create by bank-auto-transfer"
//       });
//     }
//     commit("SET_TOOL_INFORMATION_TO_SELECTED_DATA", taskInformation.data);
//   }
//   async UnlockSelectedTask(_, taskID) {
//     var result = await unlockTask(taskID);
//     return result.data.success;
//   }
//   async MarkTaskFail({ dispatch, getters } { isHandleCurrentTask, reason }) {
//     const dataForAPI = { ...getters.task.dataForAPI };
//     dataForAPI.remark = reason;
//     var result = await markTaskFail(dataForAPI);
//     if (result.data.success) {
//       // Check if fail or re-assign
//       await this.MoveCurrentTaskToLast", {
//         isHandleCurrentTask,
//         status: reason === "re-assign" ? "re-assign" : "fail"
//       });
//       await this.GetAllTasks");
//     } else {
//       throw new Error("Mark task as fail error, please contact admin");
//     }
//   }
//   async MarkTaskToConfirm(
//     { dispatch, getters }
//     { isHandleCurrentTask, taskID }
//   ) {
//     try {
//       var platform = getters.app.platform;
//       var operator = getters.name;
//       const result = await markTaskToConfirm(taskID, {
//         platform,
//         status: "to-confirm",
//         operator
//       });
//       if (result.status === 200) {
//         await this.MoveCurrentTaskToLast", {
//           isHandleCurrentTask,
//           status: "to-confirm"
//         });
//         await this.GetAllTasks");
//       }
//     } catch (error) {
//       throw new Error("Mark task as to confirm fail, please contact admin");
//     }
//   }
//   async CheckTaskExecuted({ commit, dispatch, getters }) {
//     try {
//       // Check local
//       var result = await selectTaskStatus(getters.task.dataForAPI.taskId);
//       if (result.length > 0) return [true, result];

//       // Check remote
//       var remoteResult = await checkIfExecuted(getters.task.selected.toolID);
//       return [true, remoteResult.data];
//     } catch (error) {
//       this.SetConsole", { message: error, level: "error" });
//       return [false];
//     }
//   }
//   async CreateTaskExecuteRecord({ getters } reason) {
//     var toolID = getters.task.selected.toolID;
//     await createExecuteRecord(toolID, {
//       operateType: "execute",
//       operator: getters.name,
//       note: reason
//     });
//   }
//   async MoveCurrentTaskToLast(
//     { commit, dispatch, getters }
//     { isHandleCurrentTask, status }
//   ) {
//     // Clear selected task
//     if (isHandleCurrentTask) {
//       var selectedTask = { ...getters.task.selected };
//       selectedTask.toolStatus = status;
//       if (selectedTask) commit("SET_LAST_SELECTED_DATA", selectedTask);

//       commit("SET_SELECTED_DATA", null);
//       commit("SET_DATA_FOR_API", null);
//       commit("SET_SELECTED_DATA_FOR_API", null);
//     }

//     await Promise.all([
//       this.GetCurrentCardBoBalance"),
//       this.GetAllTasks")
//     ]).catch(error  {
//       throw error;
//     });
//   }
//   // This for unset everything
//   async UnsetTask({ commit }) {
//     commit("SET_LAST_SELECTED_DATA", null);
//     commit("SET_SELECTED_DATA", null);
//     commit("SET_DATA_FOR_API", null);
//     commit("SET_SELECTED_DATA_FOR_API", null);
//   }
// }

export const TaskModule = getModule(Task);
