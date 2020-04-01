export default interface ILog {
  level: "error" | "warn" | "info" | "verbose" | "debug" | "silly";
  message: string;
}
