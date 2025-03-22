import { formatUnits } from "viem";

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

/**
 * Formats a token value to a human readable format
 * @param value - The token value to format
 * @param decimals - The number of decimals to format to
 * @returns The formatted token value
 */
export const formatTokenToValue = (value: number | string | bigint, decimals: number = 9) =>
  formatUnits(BigInt(value), decimals);

/**
 * Formats a token value to a human readable format
 * @param value - The token value to format
 * @returns The formatted token value
 */
export const formatValueToNumber = (value: number | string | bigint) =>
  formatNumber(formatTokenToValue(value));

/**
 * Formats a full address to a shorter address
 * @param address - The full address to format
 * @returns The formatted short address
 */
export const truncateAddress = (address: string): string => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 5)}...${address.slice(-3)}`;
};

export const formatLargeNumber = (value: number) => {
  if (value >= 1e27) {
    return `${(value / 1e27).toFixed(2)} O`; // Format to octillions
  } else if (value >= 1e24) {
    return `${(value / 1e24).toFixed(2)} St`; // Format to septillions
  } else if (value >= 1e21) {
    return `${(value / 1e21).toFixed(2)} S`; // Format to sextillions
  } else if (value >= 1e18) {
    return `${(value / 1e18).toFixed(2)} Q`; // Format to quintillions
  } else if (value >= 1e15) {
    return `${(value / 1e15).toFixed(2)} Q`; // Format to quadrillions
  } else if (value >= 1e12) {
    return `${(value / 1e12).toFixed(2)} T`; // Format to trillions
  } else if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)} B`; // Format to billions
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)} M`; // Format to millions
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)} K`; // Format to thousands
  }
  return value.toString();
};