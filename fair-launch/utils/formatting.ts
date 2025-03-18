/**
 * Formats a number to a human readable format
 * @param value - The number to format
 * @returns The formatted number
 */
export const formatNumber = (value: number | string, maxDecimals: number = 8) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(Number(value));

/**
 * Formats a timestamp to a human readable format
 * @param timestamp - The timestamp to format
 * @returns The formatted timestamp
 */
export const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp * 1000); // Convert to milliseconds
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  return date.toLocaleString("en", options).replace(",", "");
};