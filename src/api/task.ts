import dayjs from "dayjs";
import request from "@/utils/request";

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

export function getTaskDetail(taskId: number, withdrawId: number) {
  return request({
    url: "/ps-ops-console/api/withdraw/loadWithdrawInfo",
    method: "GET",
    params: {
      withdrawId,
      payDetailId: taskId
    }
  });
}

export function lockTask(taskId: number) {
  return request({
    url: "/ps-ops-console/api/task/lock",
    method: "GET",
    params: {
      taskId
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

export function markTaskSuccess(data: any) {
  return request({
    url: "/ps-ops-console/api/withdraw/markAsSuccessPaymentDetail",
    method: "POST",
    data
  });
}

export function markTaskFail(data: any) {
  return request({
    url: "/ps-ops-console/api/withdraw/markAsFailPaymentDetail",
    method: "POST",
    data
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