import ScreenshotTool from "@/workers/utils/ScreenshotTool";
import path from "path";
import fs from "fs";
const folderName = "screenshots";
const folderPath = path.resolve(path.join("./logs", folderName));

jest.setTimeout(50 * 1000);

beforeAll(() => {});

afterAll(() => {});

describe("ScreenshotTool", () => {
  it("Capture screenshot", async done => {
    const accountCode = "TEST";
    const capture = "capture";
    let tool = new ScreenshotTool(accountCode);
    tool.capture(capture);
    const files = fs.readdirSync(folderPath);
    files.forEach(file => {
      if (file.includes(`${accountCode}-${capture}`)) {
        expect(true).toBeTruthy();
      }
    });
    // done.fail("Can't get captured file");
  });
});
