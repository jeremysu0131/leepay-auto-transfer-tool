const { exec } = require("child_process");
const cwd =
  process.env.NODE_ENV === "production"
    ? process.resourcesPath + "/bankWorkerTool"
    : "bankWorkerTool";

export async function execute(bankCode: string, command: string, params: string): Promise<Number> {
  return new Promise((resolve, reject) => {
    var child = exec(`BankWorkerTool.exe "ACTIVEX_TOOL" "${bankCode}" "${command}" "${params}"`, {
      shell: false,
      cwd
    });
    child.on("error", (err: any) => reject(err));
    child.on("exit", (data: Number) => resolve(data));
  });
}
