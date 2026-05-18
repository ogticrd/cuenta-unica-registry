import { UAParser } from "ua-parser-js";

export interface UserAgentTranslations {
  unknownBrowser: string;
  unknownOS: string;
  connector: string;
}

export function formatUserAgent(
  userAgent: string | undefined | null,
  fallback: string = "Dispositivo desconocido",
  translations: UserAgentTranslations
): string {
  if (!userAgent) return fallback;

  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();

  const browserName = browser.name || translations.unknownBrowser;
  
  const osName = os.name ? os.name : translations.unknownOS;
  
  let osVersion = os.version ? ` ${os.version}` : "";
  if (osName === "Windows" && os.version === "10.0") {
    osVersion = " 10";
  }

  if (!browser.name && !os.name) {
    return userAgent.length > 30 ? `${userAgent.substring(0, 30)}...` : userAgent;
  }

  return `${browserName}${translations.connector}${osName}${osVersion}`;
}
