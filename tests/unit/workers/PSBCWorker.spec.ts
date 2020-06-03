import BankWorker from "@/workers/BankWorker";
import TaskDetailViewModel from "@/models/taskDetailViewModel";

let worker: BankWorker;
let remitterAccount = {
  balance: 1,
  code: "N.PSBC.123",
  loginName: "icjksuxjne",
  loginPassword: "zz700414",
  usbPassword: "zz700414",
  proxy: "10.203.0.14:8800"
};
let task: TaskDetailViewModel = {
  amount: 0.1,
  id: new Date().getTime(),
  transferFee: 0,
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
      height: 980
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

  it("Get Cookie", async () => {
    let isSuccess = await worker.getCookie();
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

  it("Confirm Transfer Result", async () => {
    let isSuccess = await worker.confirmTransaction();
    expect(isSuccess.success).toBe(true);
  });

  it("check transaction success", async () => {
    let isSuccess = await worker.checkIfTransactionSuccess();
    expect(isSuccess.success).toBe(true);
  });
});
