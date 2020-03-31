import { setLog } from "../storeHelper";

const axios = require("axios");

export function run(usbKeyName) {
  try {
    axios.get(`http://172.19.104.175/robots/api/slot/${usbKeyName}`);
  } catch (error) {
    return setLog({ level: "error", message: error });
  }
}
