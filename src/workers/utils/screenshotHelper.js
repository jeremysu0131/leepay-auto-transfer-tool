import moment from "moment";
import { setLog } from "./storeHelper";

const electron = require("electron");
const desktopCapturer = electron.desktopCapturer;
const electronScreen = electron.screen;

const fs = require("fs");
const path = require("path");
const folderName = "screenshots";
const folderPath = path.join(".", folderName);

function getScreenSize() {
  return electronScreen.getPrimaryDisplay().workAreaSize;
}

function capture(filename) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  desktopCapturer.getSources(
    { types: ["screen"], thumbnailSize: getScreenSize() },
    (error, sources) => {
      if (error) setLog({ level: "error", message: error.toString() });

      sources.forEach(function(source) {
        if (source.name === "Entire screen" || source.name === "Screen 1") {
          fs.writeFile(
            `${folderPath}/${moment().format("YYYYMMDDHHmmss")}-${filename}.png`,
            source.thumbnail.toPng(),
            error => {
              if (error) setLog({ level: "error", message: error.toString() });
            },
          );
        }
      });
    },
  );
}

/**
 * 查询保存时间超过指定天的文件
 * @param {string} folderPath
 * @param {number} day
 */
// TODO: Test it
function clearOldScreenshots(folderPath, day = 7) {
  const result = [];
  const diffTime = day * 24 * 60 * 60 * 1000;
  const files = fs.readdirSync(folderPath);
  files.forEach(file => {
    const filePath = path.join(folderPath, file);
    const fileStat = fs.statSync(filePath);

    if (fileStat.isFile() && fileStat.birthtimeMs < Date.now() - diffTime) {
      fs.unlink(filePath);
    }
  });
  return result;
}

export { capture, clearOldScreenshots };
