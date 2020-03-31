const { exec } = require("child_process");
const cwd =
  process.env.NODE_ENV === "production"
    ? process.resourcesPath + "/bankActivexTool"
    : "bankActivexTool";

export async function execute(bankCode, command, params) {
  return new Promise((resolve, reject) => {
    var child = exec(`BankActivexTool.exe "${bankCode}" "${command}" "${JSON.stringify(params)}"`, {
      shell: false,
      cwd,
    });
    child.on("error", err => reject(err));
    child.on("exit", data => resolve(data));
  });
}
