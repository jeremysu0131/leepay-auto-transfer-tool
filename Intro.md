# Auto transfer tool used APIs
---
## Description

### Base URL
The base url is `http://ops.leepayment.com`, so when you see the `url` inside the function of `request` which means it will combines the base url automatically. 
### Params
When you see the key of params which means it is the `query strings` of the URL
### Data
When you see the key of params which means it is the `data` that used for http request

## Auth

### Login
```js
export function login({ username, password }: { username: string; password: string }) {
  return request({
    url: "/ps-ops-mgmt/api/operator_sessions",
    method: "POST",
    data: {
      operatorName: username,
      password
    }
  });
}
```

### Send OTP
```js
export function sendOTP(otp: string) {
  return request({
    url: "/ps-ops-mgmt/api/auth/google/valid-otp?otp=" + otp,
    method: "POST"
  });
}
```

### Logout
```js
export function logout() {
  return request({
    url: "/ps-ops-mgmt/api/operator_sessions/logout",
    method: "DELETE"
  });
}
```

## Account

### Get accounts
```js
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
```

### Get BO balance
```js
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
```

### Get group
```js
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
```

### Get detail
```js
export function getDetailById(id: number) {
  return request({
    url: "/ps-ops-console/api/bank/account/loadBankAccountDetails",
    method: "GET",
    params: {
      bankAccountId: id
    }
  });
}
```

## Task

### Get all
```js
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
  return request({
    url: "/ps-ops-console/api/withdraw/searchWithdrawForVendorView",
    method: "POST",
    params,
    data
  });
}
```

### Get detail by id
```js
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
```

### Lock task
```js
export function lock(taskId: number) {
  return request({
    url: "/ps-ops-console/api/task/lock",
    method: "GET",
    params: {
      taskId
    }
  });
}
```

### Unlock task
```js
export function unlock(taskId: number) {
  return request({
    url: "/ps-ops-mgmt/api/subsystem/workflow/task/unlock",
    method: "POST",
    data: {
      taskId
    }
  });
}
```

### Mark task success
> Note: for more details of data for mark success and fail, please check the section of **The Structure of Task Model** in the bottom
```js
export function markTaskSuccess(data: TaskModel) {
  return request({
    url: "/ps-ops-console/api/withdraw/markAsSuccessPaymentDetail",
    method: "POST",
    data
  });
}

```

### Mark task fail
```js
export function markTaskFail(data: TaskModel) {
  return request({
    url: "/ps-ops-console/api/withdraw/markAsFailPaymentDetail",
    method: "POST",
    data
  });
}
```

## Note

### The Structure of Task Model
```ts
export default interface TaskModel {
  id: number;
  withdraw: Withdraw;
  transCharge: number;
  referrerCharge: null;
  amount: number;
  status: string;
  remarks: string;
  bankAcct: BankAcct;
  taskId: number;
  processBy: null;
  processDate: null;
  claimBy: null;
  claimDate: null;
  updateTime: number;
  bankAcctWithdrawTxId: null;
  bankAcctWithdrawFeeTxId: null;
  createTime: number;
  merchant: Merchant;
  agent: null;
  duration: null;
  remark: string;
  version: number;
  newCharge: number;
  bankName: string;
  auto: boolean;
  idReport: string;
  bankString: string;
  requestTimeStr: string;
  statusStr: string;
  processDateStr: null;
  createTimeStr: string;
  updateTimeStr: string;
  merchantNameString: string;
  clientName: string;
  formattedDuration: null;
  transChargeFormatted: string;
  bankAcctCode: string;
  operatorName: null;
  requestAmt: number;
  merchantOrderNo: string;
}

interface BankAcct {
  id: number;
  bankAcctCode: string;
  acsAcctId: number;
  acsFreezeAcctId: null;
  acsCustomerId: null;
  bank: Bank;
  displayName: null;
  pgAcctId: null;
  bankAcctName: null;
  status: null;
  balanceLimit: null;
  depositQuota: null;
  createTime: null;
  updatedBy: null;
  updateTime: null;
  withdrawLimit: null;
  curServiceType: null;
  contactNumber: null;
  paymentPassword: null;
  contactDetails: null;
  merchantId: null;
  loginId: null;
  loginPassword: null;
  companyName: null;
  email: null;
  domainName: null;
  loginAddress: null;
  remark: null;
  acctType: null;
  availBalance: null;
  freezeBalance: null;
  bankType: null;
}

interface Bank {
  bankId: number;
  bankCode: null;
  bankName: string;
  tpVendorId: number;
  contactDetail: null;
  bankUrl: null;
  status: null;
  type: string;
  createdBy: null;
  updatedBy: null;
  createdAt: null;
  updatedAt: null;
  wdBindBankCard: null;
  offeredBankId: null;
  offeredBank: null;
  matchByAmount: null;
  matchByRemark: null;
}

interface Merchant {
  merchantId: number;
  merchantCode: string;
  merchantName: string;
  acsAcctId: null;
  acsFrozenAcctId: null;
  acsFreezeAcctId: null;
  status: null;
  createdAt: null;
  createdBy: null;
  updatedAt: null;
  updatedBy: null;
  agent: null;
  masterAgent: null;
  config: null;
  loginIps: null;
  withdrawIps: null;
  whitelistIps: null;
  merchantAcctGroup: null;
  balanceMonitoringLimit: null;
  userDepositQuota: null;
  mercDepositQuota: null;
  withdrawQuota: null;
  remark: null;
  remarkUpdateBy: null;
  remarkUpdateTime: null;
  freezeBalance: null;
  systemDeactivate: null;
  deactivateDate: null;
  acctGroupId: null;
  acctGroupsString: null;
}

interface Withdraw {
  id: number;
  merchant: null;
  cardName: null;
  cardNum: null;
  cardBranch: null;
  cardProvince: null;
  cardCity: null;
  platform: null;
  riskLevel: null;
  requestAmt: number;
  status: null;
  requestTime: number;
  merchantUser: null;
  type: number;
  transId: null;
  auto: string;
  bankCode: null;
  merchantCharge: null;
  offeredBank: { [key: string]: null | string };
  processBy: null;
  processDate: null;
  paidAmt: null;
  merchantOrderNo: string;
  updateTime: null;
  paymentDetails: null;
  distributeTaskId: null;
  acsTxId: null;
  acsFeeTxId: null;
  version: null;
  agent: null;
  pushTrans: null;
  duration: null;
  refund: null;
  accountType: null;
  requestTimeStr: string;
  statusStr: null;
  processDateStr: null;
  updateTimeStr: null;
  clientName: null;
  formattedDuration: null;
  typeStr: string;
  offeredBankName: string;
  operatorNameProcessBy: null;
  transIdReport: string;
  refundRemarks: null;
  merchantName: null;
}

```
