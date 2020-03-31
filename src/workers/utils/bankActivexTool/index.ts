const { exec } = require("child_process");
const cwd =
  process.env.NODE_ENV === "production"
    ? process.resourcesPath + "/bankActivexTool"
    : "bankActivexTool";

export async function execute(bankCode:string, command:string, params:string) {
  return new Promise((resolve, reject) => {
    var child = exec(`BankActivexTool.exe "${bankCode}" "${command}" "${JSON.stringify(params)}"`, {
      shell: false,
      cwd
    });
    child.on("error", (err: any) => reject(err));
    child.on("exit", (data: unknown) => resolve(data));
  });
}
