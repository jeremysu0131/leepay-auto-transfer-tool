const { exec } = require("child_process");
const cwd =
  process.env.NODE_ENV === "production" ? process.resourcesPath + "/bankWorkerTool" : "bankWorkerTool";

export function focusAndCheckIE() {
  return new Promise((resolve, reject) => {
    var child = exec("BankWorkerTool.exe \"WINDOW_FOCUS_TOOL\"", { shell: false, cwd });
    child.on("error", (err: any) => reject(err));
    child.on("exit", () => resolve());
  });
}
