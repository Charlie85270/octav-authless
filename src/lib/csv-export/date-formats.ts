import { format } from "date-fns";
import { parseTimestamp } from "@/lib/utils";

export function koinlyDate(timestamp: string): string {
  return format(parseTimestamp(timestamp), "yyyy-MM-dd HH:mm") + " UTC";
}

export function cointrackerDate(timestamp: string): string {
  return format(parseTimestamp(timestamp), "MM/dd/yyyy HH:mm:ss");
}

export function coinledgerDate(timestamp: string): string {
  return parseTimestamp(timestamp).toISOString();
}

export function taxbitDate(timestamp: string): string {
  return format(parseTimestamp(timestamp), "yyyy-MM-dd'T'HH:mm:ss'Z'");
}

export function tokentaxDate(timestamp: string): string {
  return parseTimestamp(timestamp).toISOString();
}

export function accointingDate(timestamp: string): string {
  return format(parseTimestamp(timestamp), "MM/dd/yyyy HH:mm:ss");
}

export function zenledgerDate(timestamp: string): string {
  return format(parseTimestamp(timestamp), "yyyy-MM-dd HH:mm:ss");
}

export function cryptoTaxCalcDate(timestamp: string): string {
  return format(parseTimestamp(timestamp), "yyyy-MM-dd HH:mm:ss");
}

export function tresFinanceDate(timestamp: string): string {
  return format(parseTimestamp(timestamp), "yyyy-MM-dd HH:mm:ss");
}

export function cryptioDate(timestamp: string): string {
  return format(parseTimestamp(timestamp), "yyyy-MM-dd HH:mm:ss");
}
