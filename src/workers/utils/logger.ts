import {
  createLogger,
  format as _format,
  transports as _transports
} from "winston";
import "winston-daily-rotate-file";
import { join } from "path";
const logFolderLocation =
  process.env.NODE_ENV === "production"
    ? "/var/logs/bank-internal-fund-transfer-tool"
    : "./logs";

const logger = createLogger({
  level: "debug",
  format: _format.combine(
    _format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    _format.json()
  ),
  transports: [
    // - Write to all logs with level `info` and below to `combined.log`
    new _transports.DailyRotateFile({
      level: "info",
      filename: join(logFolderLocation, "worker-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxFiles: "7d",
      zippedArchive: true
    })
    // - Write all logs error (and below) to `error.log`.
    // new winston.transports.File({
    //   filename: path.join(logFolderLocation, `error.log`),
    //   level: "error",
    // }),
  ],
  exceptionHandlers: [
    new _transports.File({
      filename: join(logFolderLocation, "worker-exceptions.log")
    })
  ]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new _transports.Console({
      format: _format.combine(_format.json())
    })
  );
}

export default logger;
