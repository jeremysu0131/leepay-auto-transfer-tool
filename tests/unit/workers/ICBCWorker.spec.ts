import BankWorker from "@/workers/BankWorker";
import TaskDetailModel from "@/workers/models/taskDetailModel";

let worker: BankWorker;
let remitterAccount = {
  id: 63819,
  balance: 1,
  code: "TEST.ICBC.361-1",
  loginName: "pdkeufjvn",
  loginPassword: "pp656565",
  usbPassword: "pp656565",
  queryPassword: undefined,
  proxy: "10.203.0.14:8800"
};
let task: TaskDetailModel = {
  amount: 1,
  transferFee: 0,
  id: 0,
  payeeAccount: {
    bank: { chineseName: "中国农业银行" },
    cardNumber: "6228480299142539475",
    holderName: "付海伦"
  }
};

jest.setTimeout(120 * 1000);

beforeAll(() => {
  worker = new BankWorker(remitterAccount);
});

afterAll(() => {
  // worker.closeSelenium();
  worker.unsetProxy();
});

describe("ICBCWorker", () => {
  it("Set IE Environment", async () => {
    let isSuccess = await worker.setIEEnvironment();
    expect(isSuccess.success).toBe(true);
  });
  it("Set Proxy", async () => {
    let isSuccess = await worker.setProxy();
    expect(isSuccess.success).toBe(true);
  });
  it("Launch Selenium", async () => {
    let isSuccess = await worker.launchSelenium({
      width: 1920,
      height: 1080
    });
    expect(isSuccess.success).toBe(true);
  });

  it("Input Sign In Information", async () => {
    let isSuccess = await worker.inputSignInInformation();
    expect(isSuccess.success).toBe(true);
  });

  it("Submit to sign in", async () => {
    let isSuccess = await worker.submitToSignIn();
    expect(isSuccess.success).toBe(true);
  });

  it("Check if sign success", async () => {
    let isSuccess = await worker.checkIfLoginSuccess(false);
    expect(isSuccess.success).toBe(true);
  });

  it("Set Task", async () => {
    let isSuccess = await worker.setTask(task);
    expect(isSuccess.success).toBe(true);
  });

  it("Get Balance", async () => {
    let isSuccess = await worker.getBalance();
    expect(isSuccess.success).toBe(true);
  });

  it("Go Transfer Page", async () => {
    let isSuccess = await worker.goTransferPage();
    expect(isSuccess.success).toBe(true);
  });

  it("Fill Transfer Form", async () => {
    let isSuccess = await worker.fillTransferFrom();
    expect(isSuccess.success).toBe(true);
  });

  it("Confirm transaction", async () => {
    let isSuccess = await worker.confirmTransaction();
    expect(isSuccess.success).toBe(true);
  });

  it("Check if transaction success", async () => {
    let isSuccess = await worker.checkIfTransactionSuccess();
    expect(isSuccess.success).toBe(true);
  });
  it("Get Balance", async () => {
    let isSuccess = await worker.getBalance();
    expect(isSuccess.success).toBe(true);
  });
});
