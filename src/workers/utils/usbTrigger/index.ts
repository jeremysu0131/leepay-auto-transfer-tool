import logger from "../logger";

const axios = require("axios");

export function run(usbKeyName: any) {
  try {
    axios.get(`http://172.19.104.175/robots/api/slot/${usbKeyName}`);
  } catch (error) {
    logger.log({ level: "error", message: error });
  }
}
