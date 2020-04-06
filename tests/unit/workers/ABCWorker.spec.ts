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

jest.setTimeout(50 * 1000);

beforeAll(() => {
  worker = new BankWorker(remitterAccount);
  console.log("aaaaa", worker);
});

afterAll(() => {
  worker.closeSelenium();
});

describe("ABCWorker:launchSelenium", () => {
  it(
    "isLaunched",
    async() => {
      var isLaunched = await worker.launchSelenium({
        width: 1920,
        height: 1080
      });
      expect(isLaunched).toBe(true);
    }
  );
});
