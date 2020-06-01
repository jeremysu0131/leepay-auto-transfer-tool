import winston, { createLogger, format as _format, transports as _transports } from "winston";
import "winston-daily-rotate-file";
import dayjs from "dayjs";
import { join } from "path";
const logFolderLocation = (process.env.VUE_APP_LOG_LOCATION as string) || "./logs";

export default class LoggerService {
  private logger!: winston.Logger;
  constructor(className: string) {
    this.createLogger(className);
  }
  private createLogger(className: string) {
    const logFormat = winston.format.printf(info => {
      if (info.level === "info" || info.level === "warn") info.level += " ";
      let message = `${dayjs().format("HH:mm:ss")} | ${info.level.toUpperCase()} |`;

      if (className) message += ` ${className} |`;

      message += ` ${info.message} |`;
      return message;
    });
    const logger = createLogger({
      level: "debug",
      format: logFormat,
      transports: [
        // - Write to all logs with level `info` and below to `combined.log`
        new _transports.DailyRotateFile({
          level: "info",
          filename: join(logFolderLocation, "application-%DATE%.log"),
          datePattern: "YYYY-MM-DD",
          maxFiles: "7d",
          zippedArchive: true
        })
      ],
      exceptionHandlers: [
        new _transports.File({
          filename: join(logFolderLocation, "application-exceptions.log")
        })
      ]
    });
    if (process.env.NODE_ENV !== "production") {
      logger.add(new _transports.Console({ format: logFormat }));
    }
    this.logger = logger;
  }
  async log({ level, message }: { level: string; message: string }) {
    this.logger.log({ level, message });
  }
  async debug(message: string) {
    this.logger.log("debug", message);
  }
  async info(message: string) {
    this.logger.log("info", message);
  }
  async warn(message: string) {
    this.logger.log("warn", message);
  }
  async error(message: string) {
    this.logger.log("error", message);
  }
}
