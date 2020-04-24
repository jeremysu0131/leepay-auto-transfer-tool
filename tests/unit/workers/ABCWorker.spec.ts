import BankWorker from "@/workers/BankWorker";
import TaskDetailModel from "../../../src/workers/models/taskDetailModel";
import RemitterAccountModel from '@/workers/models/remitterAccountModel';

var worker: BankWorker;
var remitterAccount: RemitterAccountModel = {
  id: 63819,
  balance: 1,
  code: "TEST.ABC.237",
  loginName: "kdjroufe",
  loginPassword: "zz326598",
  usbPassword: "zz326598",
  queryPassword: "326598",
  proxy: "52.175.31.129:8800"
};
var task: TaskDetailModel = {
  amount: 1,
  id: 0,
  bankCharge: 0,
  payeeAccount: {
    bank: { chineseName: "中国邮政储蓄银行" },
    cardNumber: "6217993000391513895",
    holderName: "康贻龙"
  }
};

jest.setTimeout(50 * 1000);

beforeAll(() => {
  worker = new BankWorker(remitterAccount);
  console.log("aaaaa", worker);
});

afterAll(() => {
  // worker.closeSelenium();
  // worker.unsetProxy();
});

describe("ABCWorker", () => {
  it("Set IE Environment", async () => {
    var isSuccess = await worker.setIEEnvironment();
    expect(isSuccess.isFlowExecutedSuccess).toBe(true);
  });
  // it("Set Proxy", async() => {
  //     var isSuccess = await worker.setProxy();
  //     expect(isSuccess).toBe(true);
  //   });
  it("Launch Selenium", async () => {
    var isSuccess = await worker.launchSelenium({
      width: 1920,
      height: 1080
    });
    expect(isSuccess.isFlowExecutedSuccess).toBe(true);
  });

  it("Input Sign In Information", async () => {
    var isSuccess = await worker.inputSignInInformation();
    expect(isSuccess.isFlowExecutedSuccess).toBe(true);
  });

  it("Submit to sign in", async () => {
    var isSuccess = await worker.submitToSignIn();
    expect(isSuccess.isFlowExecutedSuccess).toBe(true);
  });

  it("Check if sign success", async () => {
    var isSuccess = await worker.checkIfLoginSuccess(false);
    expect(isSuccess.isFlowExecutedSuccess).toBe(true);
  });

  it("Set Task", async () => {
    var isSuccess = await worker.setTask(task);
    expect(isSuccess.isFlowExecutedSuccess).toBe(true);
  });

  it("Go Transfer Page", async () => {
    var isSuccess = await worker.goTransferPage();
    expect(isSuccess.isFlowExecutedSuccess).toBe(true);
  });

  it("Fill Transfer Form", async () => {
    var isSuccess = await worker.fillTransferFrom();
    expect(isSuccess.isFlowExecutedSuccess).toBe(true);
  });

  it("Confirm transaction", async () => {
    var isSuccess = await worker.confirmTransaction();
    expect(isSuccess.isFlowExecutedSuccess).toBe(true);
  });

  it("Check if transaction success", async () => {
    var isSuccess = await worker.checkIfTransactionSuccess();
    expect(isSuccess.isFlowExecutedSuccess).toBe(true);
  });
});
