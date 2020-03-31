import { LogModule } from "../../../store/modules/log";

const axios = require("axios");

export function run(usbKeyName: any) {
  try {
    axios.get(`http://172.19.104.175/robots/api/slot/${usbKeyName}`);
  } catch (error) {
    LogModule.SetLog({ level: "error", message: error });
  }
}
