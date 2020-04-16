import BankWorker from "@/workers/BankWorker";
import TaskDetailModel from "../../../src/workers/models/taskDetailModel";

var worker: BankWorker;
var remitterAccount = {
  id: 63819,
  balance: 1,
  code: "5.ABC.235",
  loginName: "bsodfidd",
  loginPassword: "zz800525",
  usbPassword: "800525",
  proxy: "10.203.0.14:8800"
};
var task:TaskDetailModel = {
  amount: 1,
  id: 0,
  payeeAccount: {
    bank: { },
    cardNumber: "1234567890",
    holderName: "JJJJ"
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
  it("Set IE Environment", async() => {
      var isSuccess = await worker.setIEEnvironment();
      expect(isSuccess).toBe(true);
    });
  // it("Set Proxy", async() => {
  //     var isSuccess = await worker.setProxy();
  //     expect(isSuccess).toBe(true);
  //   });
  it("Launch Selenium", async() => {
      var isSuccess = await worker.launchSelenium({
        width: 1920,
        height: 1080
      });
      expect(isSuccess).toBe(true);
    });

  it("Input Sign In Information", async() => {
      var isSuccess = await worker.inputSignInInformation();
      expect(isSuccess).toBe(true);
    });

  it("Submit to sign in", async() => {
      var isSuccess = await worker.submitToSignIn();
      expect(isSuccess).toBe(true);
    });

  it("Check if sign success", async() => {
      var isSuccess = await worker.checkIfLoginSuccess(false);
      expect(isSuccess).toBe(true);
    });

  it("Set Task", async() => {
      var isSuccess = await worker.setTask(task);
      expect(isSuccess).toBe(true);
    });

  it("Go Transfer Page", async() => {
      var isSuccess = await worker.goTransferPage();
      expect(isSuccess).toBe(true);
    });

  it("Fill Transfer Form", async() => {
      var isSuccess = await worker.fillTransferFrom();
      expect(isSuccess).toBe(true);
    });

  it("", async() => {
      var isSuccess = await worker.confirmTransaction();
      expect(isSuccess).toBe(true);
    });

  it("", async() => {
      var isSuccess = await worker.checkIfTransactionSuccess();
      expect(isSuccess).toBe(true);
    });
});
