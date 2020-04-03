import request from "@/utils/request";

export function getList() {
  return request({
    url: "/adminAcct!listAllCompanyAcct.do",
    method: "GET"
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

// export function getAccountCodeListInSkypay() {
//   return requestSkypay({
//     url: "/adminAcct!listAllCompanyAcct.do",
//     method: "GET"
//   });
// }

// export function getAccountDetailInSkypay(accountCodeID:number) {
//   return requestSkypay({
//     url: "/adminAcct!load.do",
//     method: "POST",
//     data: {
//       "a.id": accountCodeID
//     }
//   });
// }
