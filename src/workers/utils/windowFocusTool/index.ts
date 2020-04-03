import { execSync } from "child_process";
import logger from "../logger";

export function focusAndCheckIE() {
  run();
}

function run() {
  try {
    execSync("WindowFocusTool.exe", {
      // shell: false,
      cwd:
        process.env.NODE_ENV === "production"
          ? process.resourcesPath + "/windowFocusTool"
          : "windowFocusTool"
    });
  } catch (error) {
     logger.log({ level: "error", message: error });
  }
}
