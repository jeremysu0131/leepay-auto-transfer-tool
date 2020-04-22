const { exec } = require("child_process");
const cwd =
  process.env.NODE_ENV === "production" ? process.resourcesPath + "/bankWorkerTool" : "bankWorkerTool";

export const KeyEnum = {
  TAB: "VK_TAB",
  RETURN: "VK_RETURN",
  BACKSPACE: "VK_BACKSPACE",
  "ALT+TAB": "VK_ALT_TAB"
};

Object.freeze(KeyEnum);

export async function sendText(text: any, waitingTime = 3000, textInterval = 200) {
  return new Promise((resolve, reject) => {
    var child = exec(`BankWorkerTool.exe "KEY_SENDER" "${text}" "${waitingTime}"`, { shell: false, cwd });
    child.on("error", (err: any) => reject(err));
    child.on("exit", () => resolve());
  });
}

export async function sendKey(key: string, waitingTime = 3000) {
  return new Promise((resolve, reject) => {
    var child = exec(`BankWorkerTool.exe "KEY_SENDER" "${key}" "${waitingTime}"`, { shell: false, cwd });
    child.on("error", (err: any) => reject(err));
    child.on("exit", () => resolve());
  });
}
