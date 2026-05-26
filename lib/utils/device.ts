import { UAParser } from "ua-parser-js";

export interface UserAgentTranslations {
  unknownBrowser: string;
  unknownOS: string;
  connector: string;
  detailSeparator?: string;
  deviceComputer?: string;
  deviceAndroid?: string;
  deviceIPhone?: string;
  deviceTablet?: string;
  deviceMobile?: string;
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
  const device = parser.getDevice();

  const browserName = browser.name || translations.unknownBrowser;
  
  let osName = os.name ? os.name : translations.unknownOS;
  
  let osVersion = os.version ? ` ${os.version}` : "";
  if (osName === "Windows" && os.version === "10.0") {
    osVersion = " 10";
  } else if (osName === "Mac OS") {
    osName = "macOS";
    osVersion = "";
  }

  if (!browser.name && !os.name) {
    return userAgent.length > 30 ? `${userAgent.substring(0, 30)}...` : userAgent;
  }

  let deviceType = "";
  if (os.name === "Android") {
    deviceType = translations.deviceAndroid || "Android";
  } else if (device.model === "iPhone" || os.name === "iOS") {
    deviceType = translations.deviceIPhone || "iPhone";
  } else if (device.type === "tablet") {
    deviceType = translations.deviceTablet || "Tablet";
  } else if (device.type === "mobile") {
    deviceType = translations.deviceMobile || "Móvil";
  } else {
    deviceType = translations.deviceComputer || "Computadora";
  }

  let hardwareStr = "";
  const isComputer = deviceType === (translations.deviceComputer || "Computadora");
  if (device.vendor && device.model && !isComputer) {
    hardwareStr = `${device.vendor} ${device.model}`;
  }

  const detailSeparator = translations.detailSeparator || " · ";

  let result = `${deviceType}${detailSeparator}${browserName}${translations.connector}${osName}${osVersion}`;
  
  if (hardwareStr) {
    result += `${detailSeparator}${hardwareStr}`;
  }

  return result;
}
