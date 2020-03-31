export function OperationalError(message) {
  this.name = "OperationalError";
  this.message = message;
  this.stack = new Error().stack;
}
