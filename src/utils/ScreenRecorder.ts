import ffmpeg from "fluent-ffmpeg";
import LoggerService from "./LoggerService";
import dayjs from "dayjs";
import fs from "fs";
import path from "path";
const folderName = "screen_records";
const folderPath = path.join(process.env.VUE_APP_LOG_LOCATION as string, folderName);
class ScreenRecorder {
  private accountCode: string;
  private screenRecord: ffmpeg.FfmpegCommand;
  private logger: LoggerService;
  constructor(accountCode: string) {
    this.accountCode = accountCode;
    this.screenRecord = ffmpeg();
    this.logger = new LoggerService(ScreenRecorder.name);
    this.isFolderExists();
  }

  start() {
    const logger = this.logger;
    logger.info("Start");
    this.screenRecord
      .fps(5)
      .input("desktop")
      .inputFormat("gdigrab")
      .videoCodec("libx264")
      .outputOptions([
        "-r 10",
        "-tune zerolatency",
        "-crf 28",
        "-pix_fmt yuv420p",
        "-preset ultrafast",
        "-movflags +faststart"
      ])
      .on("end", () => {
        logger.info("End");
      })
      .on("error", err => {
        logger.error(err);
      })
      .outputFormat("mp4")
      .noAudio()
      .save(`${folderPath}/${dayjs().format("YYYYMMDDHHmmss")}_${this.accountCode.replace(".", "_")}.mp4`);
  }
  stop() {
    try {
      // @ts-ignore
      this.screenRecord.ffmpegProc.stdin.write("q");
    } catch (error) {
      this.logger.warn(`Video had been stopped to record | ${error}`);
    }
  }
  private isFolderExists() {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }
  }
}

export default ScreenRecorder;
