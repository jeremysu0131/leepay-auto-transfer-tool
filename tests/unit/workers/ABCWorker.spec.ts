import BankWorker from "@/workers/BankWorker";
import TaskDetailModel from "../../../src/workers/models/taskDetailModel";

var worker: BankWorker;
var remitterAccount = {
  balance: 1,
  code: "T.ABC.001",
  loginName: "test001",
  loginPassword: "testpsw",
  usbPassword: "testpsw",
  proxy: "10.9.8.7:8800"
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
});

afterAll(() => {
  worker.closeSelenium();
  worker.unsetProxy();
});

describe("ABCWorker", () => {
  it("Set IE Environment", async() => {
      var isSuccess = await worker.setIEEnvironment();
      expect(isSuccess).toBe(true);
    });
  it("Set Proxy", async() => {
      var isSuccess = await worker.setProxy();
      expect(isSuccess).toBe(true);
    });
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

  it("Set Task", async() => {
      var isSuccess = await worker.setTask(task);
      expect(isSuccess).toBe(true);
    });
});
