import request from "@/utils/request";
import TaskDetailViewModel from "../models/taskDetailViewModel";
import dayjs from "dayjs";
import LoggerService from "@/utils/LoggerService";
import TaskModel from "@/models/taskModel";

const logger = new LoggerService("task api");

export function getAll(accountId: number) {
  const params = {
    pageSize: 50,
    pageNo: 1,
    sortOrder: ""
  };
  const data = {
    bankAcctId: accountId,
    dateType: "requestDate",
    dateFrom: +dayjs()
      .startOf("day")
      .subtract(1, "M"),
    dateTo: +dayjs().endOf("day"),
    durationFrom: null,
    durationTo: null,
    remarks: "",
    payeeName: "",
    processBy: "",
    requestAmtFrom: null,
    requestAmtTo: null,
    status: "I"
  };

  logger.info("getAllTasks | Params:" + JSON.stringify(params) + " | " + JSON.stringify(data));

  return request({
    url: "/ps-ops-console/api/withdraw/searchWithdrawForVendorView",
    method: "POST",
    params,
    data
  });
}
export function getDetail(taskId: number, withdrawId: number) {
  return request({
    url: "/ps-ops-console/api/withdraw/loadWithdrawInfo",
    method: "GET",
    params: {
      withdrawId,
      payDetailId: taskId
    }
  });
}

export function getFundTransferDetail(data: { taskId: number; ref: string }) {
  return request({
    url: "/adminWF!loadTrans.do",
    method: "POST",
    params: {
      "task.id": data.taskId,
      "task.ref": data.ref
    }
  });
}

export function getPartialWithdrawDetail(data: { taskId: number; ref: string; bankId: number }) {
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
    url: "/ps-ops-console/api/task/lock",
    method: "GET",
    params: {
      taskId
    }
  });
}

export function unlock(taskId: number) {
  return request({
    url: "/ps-ops-mgmt/api/subsystem/workflow/task/unlock",
    method: "POST",
    data: {
      taskId
    }
  });
}
export function markTaskSuccess(data: TaskModel) {
  logger.info("markTaskSuccess | Data:" + JSON.stringify(data));
  return request({
    url: "/ps-ops-console/api/withdraw/markAsSuccessPaymentDetail",
    method: "POST",
    data
  });
}

export function markTaskFail(data: TaskModel) {
  return request({
    url: "/ps-ops-console/api/withdraw/markAsFailPaymentDetail",
    method: "POST",
    data
  });
}
