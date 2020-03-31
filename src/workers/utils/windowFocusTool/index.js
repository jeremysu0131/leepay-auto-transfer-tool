import { execSync } from "child_process";
import { setLog } from "../storeHelper";

export function focusAndCheckIE() {
  run();
}

function run() {
  try {
    execSync(`WindowFocusTool.exe`, {
      shell: false,
      cwd:
        process.env.NODE_ENV === "production"
          ? process.resourcesPath + "/windowFocusTool"
          : "windowFocusTool",
    });
  } catch (error) {
    return setLog({ level: "error", message: error });
  }
}
