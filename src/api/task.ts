import dayjs from "dayjs";
import request from "@/utils/request";
import TaskDetailModel from "../models/taskDetailModel";

export function getAll() {
  return request({
    url: "/adminWF!listPaymentTask.do",
    method: "GET",
    params: {
      "wfs[]": "WP",
      page: 1,
      start: 0,
      limit: 500
    }
  });
}

export function getFundTransferDetail(data: {
  taskId: number;
  ref: string;
  bankId: number;
}) {
  return request({
    url: "/adminWF!loadTrans.do",
    method: "POST",
    params: {
      "task.id": data.taskId,
      "task.ref": data.ref
    }
  });
}

export function getPartialWithdrawDetail(data: {
  taskId: number;
  ref: string;
  bankId: number;
}) {
  return request({
    url: "/adminWF!loadPartialWithdrawPayment.do",
    method: "POST",
    params: {
      "task.id": data.taskId,
      "task.ref": data.ref,
      bankId: data.bankId
    }
  });
}

export function lock(taskId: number) {
  return request({
    url: "/adminWF!claimTask.do",
    method: "GET",
    params: {
      "task.id": taskId,
      taskName: "FT-P"
    }
  });
}

export function unlockTask(taskId: number) {
  return request({
    url: "/ps-ops-mgmt/api/subsystem/workflow/task/unlock",
    method: "POST",
    data: {
      taskId
    }
  });
}

export function markFundTransferTaskSuccess(
  task: TaskDetailModel,
  remark?: string
) {
  return request({
    url: "/adminWF!updateTask.do",
    method: "POST",
    data: {
      "task.field2": task.bankCharge,
      "task.id": task.id,
      "task.ref": task.ref,
      "task.state.state": "A",
      "task.remark": remark,
      messageSending: false
    }
  });
}

export function markFundTransferTaskFail(
  task: TaskDetailModel,
  reason: string
) {
  return request({
    url: "/adminWF!updateTask.do",
    method: "POST",
    data: {
      "task.field2": 0,
      "task.id": task.id,
      "task.ref": task.ref,
      "task.state.state": "R",
      "task.remark": reason,
      messageSending: false
    }
  });
}

/**
 * Don't know what to do
 */
export function updateInputFields(
  task: TaskDetailModel,
  remark: string
) {
  return request({
    url: "/adminWF!updateInputFields.do",
    method: "POST",
    data: {
      "task.id": task.id,
      // Processed By
      "task.field2": remark,
      "task.field8": task.bankCharge
    }
  });
}

export function markPartialWithdrawTaskSuccess(
  task: TaskDetailModel,
  remitterAccountId:number,
  remark?: string
) {
  return request({
    url: "/adminWF!updateTask.do",
    method: "POST",
    data: {
      "task.field3": remitterAccountId,
      "task.field4": "N",
      "task.field7": task.amount,
      "task.additionalInfo0": task.bankCharge,
      "task.field8": task.bankCharge,
      "task.id": task.id,
      "task.ref": task.ref,
      "task.state.state": "Y",
      "task.remark": remark,
      messageSending: false
    }
  });
}

export function markPartialWithdrawTaskFail(
  task: TaskDetailModel,
  remitterAccountId:number,
  transferFee: number,
  remark: string
) {
  return request({
    url: "/adminWF!updateTask.do",
    method: "POST",
    data: {
      "task.field3": remitterAccountId,
      "task.field4": "N",
      "task.field7": task.amount,
      "task.additionalInfo0": transferFee,
      "task.field8": transferFee,
      "task.id": task.id,
      "task.ref": task.ref,
      "task.state.state": "F",
      "task.remark": remark,
      messageSending: false
    }
  });
}

// export function markTaskToConfirm(
//   taskID: number,
//   data: { platform: string; status: string; operator: string }
// ) {
//   return requestRisk({
//     url: `/task/${taskID}/status`,
//     method: "PATCH",
//     data
//   });
// }

// export function getTaskFromToolByID(taskId: number, platform: string) {
//   return requestRisk({
//     url: `/task/${taskId}`,
//     method: "GET",
//     params: {
//       platformName: platform
//     }
//   });
// }
// /**
//  *
//  * @param {Object} data
//  * @param {number} data.taskID
//  * @param {string} data.platform
//  * @param {string} data.merchant
//  * @param {string} data.cardCode
//  * @param {string} data.amount
//  * @param {string} data.payee
//  * @param {string} data.payeeBank
//  * @param {string} data.payeeAccount
//  * @param {string} data.operator
//  * @param {string} data.status
//  * @param {string} data.remark
//  */
// export function createTaskToTool(data) {
//   return requestRisk({
//     url: "/task",
//     method: "POST",
//     data
//   });
// }

// /**
//  * Check if task has been excuted before
//  */
// export function checkIfExecuted(toolID) {
//   return requestRisk({
//     url: `/task/${toolID}/executed`,
//     method: "GET"
//   });
// }

// /**
//  * Create a task execute record
//  * @param {Object} data
//  * @param {string} data.operateType
//  * @param {string} data.operator
//  * @param {string} data.note
//  */
// export function createExecuteRecord(id, data) {
//   return requestRisk({
//     url: `/task/${id}/detail`,
//     method: "POST",
//     data
//   });
// }
