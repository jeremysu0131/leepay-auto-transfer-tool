import BankWorker from "@/workers/BankWorker";

var worker: BankWorker;
var remitterAccount = {
  balance: 0,
  code: "5.CCB.327",
  loginName: "judjencjd",
  loginPassword: "zz800525",
  usbPassword: "testpsw",
  proxy: "10.9.8.7:8800"
};

jest.setTimeout(300 * 1000);
describe("CCBWorker", () => {
  beforeAll(() => {
    worker = new BankWorker(remitterAccount);
  });
  describe("launchSelenium", () => {
    afterAll(async() => {
      await worker.closeSelenium();
    });

    it("isWorkerExist", () => {
      expect(worker).toBeDefined();
    });
    it("isLaunched", async() => {
      var isLaunched = await worker.launchSelenium({
        width: 1920,
        height: 980
      });
      expect(isLaunched).toBe(true);
    });
  });

  describe("login", () => {
    it("isLaunched", async() => {
      var isLaunched = await worker.launchSelenium({
        width: 1920,
        height: 980
      });
      expect(isLaunched).toBe(true);
    });

    it("set:account", async() => {
      const result = await worker.inputSignInInformation();
      expect(result).toEqual(true);
    });

    it("submit", async() => {
      await worker.submitToSignIn();
      const success = await worker.checkIfLoginSuccess({});
      expect(success).toEqual(true);
    });

    afterAll(async() => {
      await worker.closeSelenium();
    });
  });

  describe("getBalance", () => {
    it("isLaunched", async() => {
      var isLaunched = await worker.launchSelenium({
        width: 1920,
        height: 980
      });
      expect(isLaunched).toBe(true);
      const result = await worker.inputSignInInformation();
      expect(result).toEqual(true);
      await worker.submitToSignIn();
    });

    afterAll(async() => {
      await worker.closeSelenium();
    });

    it("getBalance", async() => {
      const result = await worker.getBalance();
      expect(result).toBeGreaterThan(0);
    });
  });

  describe.only("transfer", () => {
    it("isLaunched", async() => {
      worker = new BankWorker(remitterAccount);
      var isLaunched = await worker.launchSelenium({
        width: 1920,
        height: 1080
      });
      expect(isLaunched).toBe(true);
      await worker.inputSignInInformation();
      await worker.submitToSignIn();
    });

    it("go transfer page", async() => {
      const result = await worker.goTransferPage();
      expect(result).toEqual(true);
    });

    afterAll(async() => {
      await worker.closeSelenium();
    });
  });
});
