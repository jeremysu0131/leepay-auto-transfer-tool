import request from "@/utils/request";
import requestSkypay from "@/utils/requestSkypay";

export function getList() {
  return request({
    url: "/ps-ops-console/api/bank/account/search",
    method: "GET",
    params: {
      id: null,
      status: null,
      bankType: null,
      "bank.bankId": null,
      currentPage: "1",
      pageSize: "10000"
    }
  });
}

export function getBoBalance(id: number) {
  return request({
    url: "/ps-ops-console/api/bank/account/monitor/searchAccountBalances",
    method: "GET",
    params: {
      pageSize: 20,
      pageNo: 1,
      bankAcctId: id
    }
  });
}

export function getGroup(id: number) {
  return request({
    url: "/ps-ops-console/api/accountGroupMapping/loadAccountGroupMapping",
    method: "GET",
    params: {
      pageSize: 20,
      pageNo: 1,
      bankAccountId: id
    }
  });
}

export function getDetailById(id: number) {
  return request({
    url: "/ps-ops-console/api/bank/account/loadBankAccountDetails",
    method: "GET",
    params: {
      bankAccountId: id
    }
  });
}

export function getAssignedProxy(accountId: number) {
  return request({
    url: "/adminAcct!listAssignProxy.do",
    method: "GET",
    params: {
      acctId: accountId
    }
  });
}

export function getAccountCodeListInSkypay() {
  return requestSkypay({
    url: "/adminAcct!listAllCompanyAcct.do",
    method: "GET"
  });
}

export function getAccountDetailInSkypay(accountCodeID: number) {
  return requestSkypay({
    url: "/adminAcct!load.do",
    method: "POST",
    data: {
      "a.id": accountCodeID
    }
  });
}
