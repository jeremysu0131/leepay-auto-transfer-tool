import TaskStatusEnum from "@/enums/taskStatusEnum";
import TaskDetailModel from "@/models/taskDetailModel";
import requestRisk from "@/utils/requestRisk";
import TaskModel from "@/models/taskViewModel";

class CreateTaskRiskModel {
  taskID: number = 0;
  platform: string = "";
  merchant: string = "";
  cardCode: string = "";
  payee: string = "";
  payeeBank: string = "";
  payeeAccount: string = "";
  amount: number = 0;
  operator: string = "";
  status: string = "";
  remark: string = "";
}

export const create = async (
  task: TaskModel,
  taskDetail: TaskDetailModel,
  remitterAccountCode: string,
  operator: string
) => {
  console.log(task, taskDetail, remitterAccountCode, operator);
  let data = new CreateTaskRiskModel();
  data.taskID = taskDetail.id;
  data.platform = "skypay";
  data.merchant = task.merchant;
  data.cardCode = remitterAccountCode;
  data.payee = taskDetail.payeeAccount.holderName;
  data.payeeAccount = taskDetail.payeeAccount.cardNumber;
  data.payeeBank = taskDetail.payeeAccount.bank.chineseName || "";
  data.amount = taskDetail.amount;
  data.operator = operator;
  data.status = TaskStatusEnum.PROCESSING;
  data.remark = JSON.stringify({
    // workflow: task.workflow,
    version: process.env.VUE_APP_VERSION
  });
  let response = await requestRisk({
    url: "/task",
    method: "POST",
    data
  });
  return response.status === 201;
};
export const updateStatus = async (taskId: number, status: TaskStatusEnum, operator: string, note?: string) => {
  let response = await requestRisk({
    url: `/task/${taskId}/status`,
    method: "PATCH",
    data: {
      platform: "skypay",
      status,
      operator,
      note
    }
  });
  return response.data.status === status;
};
export const get = async (taskId: number): Promise<{ id: number; status: string }> => {
  let response = await requestRisk({
    url: `/task/${taskId}`,
    method: "GET",
    params: {
      platformName: "skypay"
    }
  });
  return response.data.id ? response.data : null;
};
export const getExecutedResult = async (toolID: number) => {
  let response = await requestRisk({
    url: `/task/${toolID}/executed`,
    method: "GET"
  });
  return response.data as Array<{
    id: number;
    taskID: number;
    operateType: string;
    operator: string;
    createAt: Date;
    note: string;
  }>;
};
export const createExecuteRecord = async (toolID: number, operateType: string, operator: string, note: string) => {
  return requestRisk({
    url: `/task/${toolID}/detail`,
    method: "POST",
    data: {
      operateType,
      operator,
      note
    }
  });
};
