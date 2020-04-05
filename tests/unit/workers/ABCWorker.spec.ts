import BankWorker from "@/workers/BankWorker";

var worker: BankWorker;
var remitterAccount = {
  balance: 0,
  code: "T.ABC.001",
  loginName: "test001",
  loginPassword: "testpsw",
  usbPassword: "testpsw",
  proxy: "10.9.8.7:8800"
};

beforeAll(() => {
  worker = new BankWorker(remitterAccount);
});

describe("ABCWorker:launchSelenium", () => {
  it(
    "isLaunched",
    async() => {
      var isLaunched = await worker.launchSelenium();
      expect(isLaunched).toBe(true);
    }
  );
});
