import { execSync } from "child_process";
import logger from "../logger";

export function focusAndCheckIE() {
  run();
}

function run() {
  try {
    execSync("BankWorkerTool.exe WINDOW_FOCUS_TOOL", {
      // shell: false,
      cwd:
        process.env.NODE_ENV === "production"
          ? process.resourcesPath + "/bankWorkerTool"
          : "bankWorkerTool"
    });
  } catch (error) {
    logger({ level: "error", message: error });
  }
}
