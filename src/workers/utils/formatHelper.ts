export function amount(amount: string | number): string {
  if (!amount) amount = "0.00";

  amount = amount.toString().replace(/[,]/g, "");

  var parsedAmount = Number.parseFloat(amount).toFixed(2);

  return isNaN(+parsedAmount) ? "0.00" : parsedAmount;
}
