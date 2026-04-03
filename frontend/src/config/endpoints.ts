const normalizeBaseUrl = (url: string): string => url.trim().replace(/\/+$/, "");

const parseWebSocketBase = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:") {
      parsed.protocol = "ws:";
    } else if (parsed.protocol === "https:") {
      parsed.protocol = "wss:";
    }
    if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
      return null;
    }
    parsed.pathname = "/";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
};

const configuredApiBase = import.meta.env.VITE_API_BASE_URL
  ? normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)
  : "";

export const API_BASE = configuredApiBase || (
  import.meta.env.DEV
    ? `http://${window.location.hostname}:8000`
    : ""
);

const defaultWsBase = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
  import.meta.env.DEV
    ? `${window.location.hostname}:8000`
    : window.location.host
}/`;

export const WS_BASE_URL = (
  parseWebSocketBase(import.meta.env.VITE_WS_BASE_URL || "") ||
  parseWebSocketBase(configuredApiBase) ||
  defaultWsBase
);
