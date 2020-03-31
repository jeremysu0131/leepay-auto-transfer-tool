/**
 *
 * @param {number|string} amount
 */
export function amount(amount) {
  if (!amount) amount = 0;

  if (typeof amount !== "string" && typeof amount !== "number") {
    throw new TypeError("Amount must be string or number");
  }

  if (typeof amount === "string") {
    amount = amount.replace(/[,]/g, "");
  }

  var parsedAmount = Number.parseFloat(amount).toFixed(2);
  return isNaN(parsedAmount) ? "0.00" : parsedAmount;
}
