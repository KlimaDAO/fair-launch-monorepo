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

/**
 * Formats a large number to a human readable format
 * @param value - The number to format
 * @returns The formatted number
 */
export const formatLargeNumber = (value: number) => {
  const thresholds = [
    { limit: 1e15, suffix: 'Q' }, // Quadrillions
    { limit: 1e12, suffix: 'T' }, // Trillions
    { limit: 1e9, suffix: 'B' },   // Billions
    { limit: 1e6, suffix: 'M' },   // Millions
    { limit: 1e3, suffix: 'k' },   // Thousands
  ];

  for (const { limit, suffix } of thresholds) {
    if (value >= limit) {
      return `${(value / limit).toFixed(2)}${suffix}`;
    }
  }
  return value.toFixed(2);
};