import logger from "./logger";
const { exec } = require("child_process");

const cwd =
  process.env.NODE_ENV === "production"
    ? process.resourcesPath + "/bankWorkerTool"
    : "bankWorkerTool";

export function setProxy(proxy: string) {
  return new Promise((resolve, reject) => {
    var child = exec(
      `BankWorkerTool.exe "REGISTRY_TOOL" "SET_PROXY" ${proxy}`,
      { shell: false, cwd }
    );
    child.on("error", (err: any) => reject(err));
    child.on("exit", () => resolve());
  });
}

export function unsetProxy() {}

export async function setIEEnvironment() {
  try {
    await setIEFeature();
    await setIESecurityZones();
    return true;
  } catch (error) {
    logger({ level: "error", message: error });
    return false;
  }
}

function setIESecurityZones(): Promise<void> {
  return new Promise((resolve, reject) => {
    var child = exec(
      'BankWorkerTool.exe "REGISTRY_TOOL" "SET_IE_SECURITY_ZONE"',
      { shell: false, cwd }
    );
    child.on("error", (err: any) => reject(err));
    child.on("exit", () => resolve());
  });
}

function setIEFeature(): Promise<void> {
  return new Promise((resolve, reject) => {
    var child = exec('BankWorkerTool.exe "REGISTRY_TOOL" "SET_IE_FEATURE"', {
      shell: false,
      cwd
    });
    child.on("error", (err: any) => reject(err));
    child.on("exit", () => resolve());
  });
}
