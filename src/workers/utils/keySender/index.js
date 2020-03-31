const { exec } = require("child_process");
const cwd =
  process.env.NODE_ENV === "production" ? process.resourcesPath + "/keySender" : "keySender";

export const KeyEnum = {
  TAB: "VK_TAB",
  RETURN: "VK_RETURN",
  BACKSPACE: "VK_BACKSPACE",
  "ALT+TAB": "VK_ALT_TAB",
};

Object.freeze(KeyEnum);

export async function sendText(text, waitingTime = 3000, textInterval = 200) {
  return new Promise((resolve, reject) => {
    var child = exec(`KeySender.exe "${text}" "${waitingTime}"`, { shell: false, cwd });
    child.on("error", err => reject(err));
    child.on("exit", () => resolve());
  });
}

export async function sendKey(key, waitingTime = 3000) {
  return new Promise((resolve, reject) => {
    var child = exec(`KeySender.exe "${key}" "${waitingTime}"`, { shell: false, cwd });
    child.on("error", err => reject(err));
    child.on("exit", () => resolve());
  });
}
