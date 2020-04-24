import TaskStatusEnum from "@/enums/taskStatusEnum";
import TaskDetailModel from "@/models/taskDetailModel";
import requestRisk from "@/utils/requestRisk";
import TaskModel from "@/models/taskModel";

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
  task: TaskDetailModel,
  remitterAccountCode: string,
  operator: string
) => {
  var data = new CreateTaskRiskModel();
  data.taskID = task.id;
  data.platform = "skypay";
  data.merchant = "";
  data.cardCode = remitterAccountCode;
  data.payee = task.payeeAccount.holderName;
  data.payeeAccount = task.payeeAccount.cardNumber;
  data.payeeBank = task.payeeAccount.bank.chineseName || "";
  data.amount = task.amount;
  data.operator = operator;
  data.status = TaskStatusEnum.PROCESSING;
  var response = await requestRisk({
    url: "/task",
    method: "POST",
    data
  });
  return response.status === 201;
};
export const updateStatus = async (
  taskId: number,
  status: TaskStatusEnum,
  operator: string
) => {
  var response = await requestRisk({
    url: `/task/${taskId}/status`,
    method: "PATCH",
    data: {
      platform: "skypay",
      status,
      operator
    }
  });
  return response.data.status === status;
};
export const get = async (task: TaskModel) => {
  var response = await requestRisk({
    url: `/task/${task.id}`,
    method: "GET",
    params: {
      platformName: "skypay"
    }
  });
  return response.data || null;
};
export const getExecutedResult = async (toolID: number) => {
  var response = await requestRisk({
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
export const createExecuteRecord = async (
  toolID: number,
  operateType: string,
  operator: string,
  note: string
) => {
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
