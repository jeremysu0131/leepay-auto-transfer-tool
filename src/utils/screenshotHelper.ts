import dayjs from "dayjs";
import logger from "../workers/utils/logger";
import { screen, desktopCapturer } from "electron";

const electron = require("electron");

const fs = require("fs");
const path = require("path");
const folderName = "screenshots";
const folderPath = path.join(".", folderName);

const getScreenSize = () => {
  return screen.getPrimaryDisplay().workAreaSize;
};

const capture = (filename: string) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  desktopCapturer.getSources(
    { types: ["screen"], thumbnailSize: getScreenSize() },
    (error, sources) => {
      if (error) logger.log({ level: "error", message: error.toString() });

      sources.forEach(function(source) {
        if (source.name === "Entire screen" || source.name === "Screen 1") {
          fs.writeFile(
            `${folderPath}/${dayjs().format("YYYYMMDDHHmmss")}-${filename}.png`,
            source.thumbnail.toPNG(),
            (error: { toString: () => any }) => {
              if (error) { logger.log({ level: "error", message: error.toString() }); }
            }
          );
        }
      });
    }
  );
};

/**
 * 查询保存时间超过指定天的文件
 * @param {string} folderPath
 * @param {number} day
 */
// TODO: Test it
const clearOldScreenshots = (folderPath: any, day = 7) => {
  const result: never[] = [];
  const diffTime = day * 24 * 60 * 60 * 1000;
  const files = fs.readdirSync(folderPath);
  files.forEach((file: any) => {
    const filePath = path.join(folderPath, file);
    const fileStat = fs.statSync(filePath);

    if (fileStat.isFile() && fileStat.birthtimeMs < Date.now() - diffTime) {
      fs.unlink(filePath);
    }
  });
  return result;
};

export { capture, clearOldScreenshots };
