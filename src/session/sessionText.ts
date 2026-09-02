import type { InterfaceLanguage } from "../models/settings.js";

export function localize(
  interfaceLanguage: InterfaceLanguage,
  english: string,
  chinese: string
): string {
  return interfaceLanguage === "chinese" ? chinese : english;
}

export function formatWarning(
  interfaceLanguage: InterfaceLanguage,
  message: string
): string {
  return `${localize(interfaceLanguage, "[WARN] ", "[警告] ")}${message}`;
}
