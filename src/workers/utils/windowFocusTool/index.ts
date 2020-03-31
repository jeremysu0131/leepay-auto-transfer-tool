import { execSync } from "child_process";
import { LogModule } from "../../../store/modules/log";

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
    return LogModule.SetLog({ level: "error", message: error });
  }
}
