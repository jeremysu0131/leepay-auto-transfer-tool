import BankWorker from "@/workers/BankWorker";
import TaskDetailModel from "../../../src/workers/models/taskDetailModel";

var worker: BankWorker;
var remitterAccount = {
  balance: 1,
  code: "N.PSBC.123",
  loginName: "icjksuxjne",
  loginPassword: "zz700414",
  usbPassword: "zz700414",
  proxy: "10.203.0.14:8800"
};
var task: TaskDetailModel = {
  amount: 0.1,
  id: new Date().getTime(),
  bankCharge: 0,
  payeeAccount: {
    bank: { chineseName: "中国建设银行" },
    cardNumber: "6217001180045669952",
    holderName: "周特"
  }
};

jest.setTimeout(180 * 1000);

beforeAll(() => {
  worker = new BankWorker(remitterAccount);
});

afterAll(() => {
  // worker.closeSelenium();
  worker.unsetProxy();
});

describe("PSBCWorker", () => {
  it("Set IE Environment", async () => {
    var isSuccess = await worker.setIEEnvironment();
    expect(isSuccess.isFlowExecutedSuccess).toBe(true);
  });
  it("Set Proxy", async () => {
    var isSuccess = await worker.setProxy();
    expect(isSuccess.isFlowExecutedSuccess).toBe(true);
  });
  it("Launch Selenium", async () => {
    var isSuccess = await worker.launchSelenium({
      width: 1920,
      height: 980
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

  it("Get Balance", async () => {
    var isSuccess = await worker.getBalance();
    expect(isSuccess.isFlowExecutedSuccess).toBe(true);
  });

  it("Get Cookie", async () => {
    var isSuccess = await worker.getCookie();
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

  // it("Confirm Transfer Result", async () => {
  //   var isSuccess = await worker.confirmTransaction();
  //   expect(isSuccess.isFlowExecutedSuccess).toBe(true);
  // });

  // it("check transaction success", async () => {
  //   var isSuccess = await worker.checkIfTransactionSuccess();
  //   expect(isSuccess.isFlowExecutedSuccess).toBe(true);
  // });
});
