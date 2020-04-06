import BankWorker from "@/workers/BankWorker";

var worker: BankWorker;
var remitterAccount = {
  balance: 0,
  code: "5.CCB.327",
  loginName: "test001",
  loginPassword: "testpsw",
  usbPassword: "testpsw",
  proxy: "10.9.8.7:8800"
};

jest.setTimeout(50 * 1000);

beforeAll(() => {
  worker = new BankWorker(remitterAccount);
});

afterAll(() => {
  worker.closeSelenium();
});

describe("CCBWorker:launchSelenium", () => {
  it("isWorkerExist", () => {
    expect(worker).toBeDefined();
  });
  it("isLaunched", async() => {
    var isLaunched = await worker.launchSelenium({
      width: 1920,
      height: 1080
    });
    expect(isLaunched).toBe(true);
  });
});

describe.only("CCBWorker:login", () => {
  beforeAll(async() => {
    var isLaunched = await worker.launchSelenium({
      width: 1920,
      height: 1080
    });
    expect(isLaunched).toBe(true);
  });

  it("set:account", async() => {
    const result = await worker.inputSignInInformation();
    expect(result).toEqual(true);
  });
});
