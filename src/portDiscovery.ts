import { exec } from "child_process";
import * as os from "os";

export interface ActivePort {
  port: number;
  pid: number;
  processName: string;
  protocol: "TCP" | "UDP";
  brand?: string;
  ip?: string;
}

interface ProcessInfo {
  name: string;
}

let cachedWindowsProcessMap: Map<number, ProcessInfo> | null = null;
let cachedUnixProcessMap: Map<number, ProcessInfo> | null = null;
let lastWindowsCacheTime = 0;
let lastUnixCacheTime = 0;
const CACHE_TTL_MS = 10000;

const BRAND_PORTS: Record<number, string> = {
  5173: "vite",
  4200: "angular",
  80: "http",
  443: "https",
  5432: "postgres",
  27017: "mongodb",
  3306: "mysql",
  6379: "redis",
};

function getBrandForPort(
  port: number,
  processName: string,
): string | undefined {
  if (BRAND_PORTS[port]) {
    return BRAND_PORTS[port];
  }
  const lowerProcess = processName.toLowerCase();
  // Web & Frontend / JS Runtimes
  if (lowerProcess.includes("vite")) return "vite";
  if (lowerProcess.includes("react")) return "react";
  if (lowerProcess.includes("vue")) return "vue";
  if (lowerProcess.includes("angular")) return "angular";
  if (lowerProcess.includes("node") || lowerProcess.includes("deno") || lowerProcess.includes("bun")) return "node";

  // Python Frameworks & Runtimes
  if (lowerProcess.includes("django")) return "django";
  if (lowerProcess.includes("fastapi")) return "fastapi";
  if (lowerProcess.includes("uvicorn")) return "uvicorn";
  if (lowerProcess.includes("flask")) return "flask";
  if (lowerProcess.includes("python") || lowerProcess.includes("gunicorn")) return "python";

  // Databases
  if (lowerProcess.includes("postgres") || lowerProcess.includes("pg_")) return "postgres";
  if (lowerProcess.includes("mongo")) return "mongodb";
  if (lowerProcess.includes("mysql") || lowerProcess.includes("mariadb")) return "mysql";
  if (lowerProcess.includes("redis")) return "redis";

  // Containers & Languages
  if (lowerProcess.includes("docker") || lowerProcess.includes("containerd")) return "docker";
  if (lowerProcess === "go" || lowerProcess === "go.exe") return "go";
  if (lowerProcess.includes("java")) return "java";
  if (lowerProcess.includes("php")) return "php";
  if (lowerProcess.includes("sinatra")) return "sinatra";
  if (lowerProcess.includes("ruby") || lowerProcess.includes("rails")) return "ruby";

  return undefined;
}

function getWindowsProcessMap(): Promise<Map<number, ProcessInfo>> {
  const now = Date.now();
  if (cachedWindowsProcessMap && now - lastWindowsCacheTime < CACHE_TTL_MS) {
    return Promise.resolve(cachedWindowsProcessMap);
  }

  return new Promise((resolve) => {
    const processMap = new Map<number, ProcessInfo>();
    exec("tasklist /FO CSV /NH", (taskError, taskStdout) => {
      if (!taskError && taskStdout) {
        for (const line of taskStdout.split("\n")) {
          const parts = line.split('","');
          if (parts.length >= 2) {
            const name = parts[0].replace(/"/g, "").trim();
            const pidStr = parts[1].replace(/"/g, "").trim();
            const pid = parseInt(pidStr, 10);
            if (!isNaN(pid)) {
              processMap.set(pid, { name });
            }
          }
        }
      }
      cachedWindowsProcessMap = processMap;
      lastWindowsCacheTime = Date.now();
      resolve(processMap);
    });
  });
}

function getUnixProcessMap(): Promise<Map<number, ProcessInfo>> {
  const now = Date.now();
  if (cachedUnixProcessMap && now - lastUnixCacheTime < CACHE_TTL_MS) {
    return Promise.resolve(cachedUnixProcessMap);
  }

  return new Promise((resolve) => {
    const processMap = new Map<number, ProcessInfo>();
    exec("ps -eo pid,comm", (error, stdout) => {
      if (!error && stdout) {
        const lines = stdout.split("\n");
        for (let i = 1; i < lines.length; i++) {
          const trimmed = lines[i].trim();
          if (!trimmed) continue;
          const match = trimmed.match(/^(\d+)\s+(.+)$/);
          if (match) {
            const pid = parseInt(match[1], 10);
            const name = match[2];
            const shortName = name.substring(name.lastIndexOf("/") + 1);
            processMap.set(pid, { name: shortName });
          }
        }
      }
      cachedUnixProcessMap = processMap;
      lastUnixCacheTime = Date.now();
      resolve(processMap);
    });
  });
}

async function discoverWindows(): Promise<ActivePort[]> {
  const processMap = await getWindowsProcessMap();
  return new Promise((resolve) => {
    exec("netstat -ano", (error, stdout) => {
      if (error || !stdout) {
        resolve([]);
        return;
      }
      const portsMap = new Map<string, ActivePort>();
      for (const line of stdout.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("TCP") && !trimmed.startsWith("UDP")) continue;

        const tokens = trimmed.split(/\s+/);
        if (tokens.length >= 4) {
          const protocol = tokens[0] as "TCP" | "UDP";
          const localAddress = tokens[1];
          const state = protocol === "TCP" ? tokens[3] : "LISTENING";
          const pidStr = protocol === "TCP" ? tokens[4] : tokens[3];
          const pid = parseInt(pidStr, 10);

          if (state !== "LISTENING" || isNaN(pid)) continue;

          const lastColonIndex = localAddress.lastIndexOf(":");
          if (lastColonIndex === -1) continue;

          const portStr = localAddress.substring(lastColonIndex + 1);
          const port = parseInt(portStr, 10);
          if (isNaN(port) || port === 0) continue;

          const rawIp = localAddress.substring(0, lastColonIndex);
          const procInfo = processMap.get(pid);
          const processName = procInfo?.name || "Unknown";
          const key = `${protocol}-${port}`;

          if (!portsMap.has(key)) {
            portsMap.set(key, {
              port,
              pid,
              processName,
              protocol,
              brand: getBrandForPort(port, processName),
              ip: rawIp,
            });
          }
        }
      }
      resolve(Array.from(portsMap.values()).sort((a, b) => a.port - b.port));
    });
  });
}

async function discoverUnix(): Promise<ActivePort[]> {
  const processMap = await getUnixProcessMap();
  return new Promise((resolve) => {
    exec("lsof -iTCP -sTCP:LISTEN -P -n", (error, stdout) => {
      if (error || !stdout) {
        resolve([]);
        return;
      }
      const portsMap = new Map<string, ActivePort>();
      const lines = stdout.split("\n");
      for (let i = 1; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed) continue;

        const tokens = trimmed.split(/\s+/);
        if (tokens.length >= 9) {
          const pid = parseInt(tokens[1], 10);
          const name = tokens[8];

          if (isNaN(pid)) continue;

          const lastColonIndex = name.lastIndexOf(":");
          if (lastColonIndex === -1) continue;

          const portStr = name.substring(lastColonIndex + 1);
          const port = parseInt(portStr, 10);
          if (isNaN(port) || port === 0) continue;

          const rawIp = name.substring(0, lastColonIndex);
          const procInfo = processMap.get(pid);
          const processName = procInfo?.name || tokens[0];
          const key = `TCP-${port}`;

          if (!portsMap.has(key)) {
            portsMap.set(key, {
              port,
              pid,
              processName,
              protocol: "TCP",
              brand: getBrandForPort(port, processName),
              ip: rawIp,
            });
          }
        }
      }
      resolve(Array.from(portsMap.values()).sort((a, b) => a.port - b.port));
    });
  });
}

export function discoverActivePorts(): Promise<ActivePort[]> {
  return os.platform() === "win32" ? discoverWindows() : discoverUnix();
}

export function killProcess(pid: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const isWindows = os.platform() === "win32";
    const cmd = isWindows ? `taskkill /F /T /PID ${pid}` : `kill -9 -${pid}`;

    exec(cmd, (error) => {
      if (error) {
        if (!isWindows) {
          exec(`kill -9 ${pid}`, (fallbackError) => {
            if (fallbackError) reject(fallbackError);
            else resolve();
          });
        } else {
          reject(error);
        }
      } else {
        resolve();
      }
    });
  });
}

export function isSystemPort(port: number, processName: string): boolean {
  const lowerProcess = processName.toLowerCase();
  const systemProcesses = [
    "system",
    "svchost.exe",
    "lsass.exe",
    "spoolsv.exe",
    "services.exe",
    "wininit.exe",
    "jhi_service.exe",
    "ss_conn_service.exe",
    "ss_conn_service2.exe",
    "alg.exe",
    "smss.exe",
    "csrss.exe",
    "searchhost.exe",
    "startmenuexperiencehost.exe",
    "dashost.exe",
    "fontdrvhost.exe",
    "code.exe",
    "code",
  ];
  if (systemProcesses.includes(lowerProcess)) return true;
  if ([135, 137, 138, 139, 445].includes(port)) return true;
  return port >= 49152;
}

export function matchesSearch(
  port: ActivePort,
  query: string,
  tunnelUrl?: string,
): boolean {
  if (!query) return true;
  const rawTokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (rawTokens.length === 0) return true;

  const tokens =
    rawTokens.length > 1
      ? rawTokens.filter(
          (t) =>
            t !== "port" &&
            t !== "pid" &&
            t !== "port:" &&
            t !== "pid:",
        )
      : rawTokens;

  const portStr = port.port.toString();
  const pidStr = port.pid.toString();
  const procName = port.processName.toLowerCase();
  const protocol = port.protocol.toLowerCase();
  const brand = (port.brand || "").toLowerCase();
  const ip = (port.ip || "").toLowerCase();
  const tunnel = (tunnelUrl || "").toLowerCase();

  return tokens.every((token) => {
    const cleanToken = token
      .replace(/^(?:port|pid)[:=]/i, "")
      .replace(/^[:#]/, "")
      .trim();

    const targetToMatch = cleanToken || token;

    return (
      portStr.includes(targetToMatch) ||
      pidStr.includes(targetToMatch) ||
      procName.includes(targetToMatch) ||
      protocol.includes(token) ||
      brand.includes(token) ||
      ip.includes(token) ||
      tunnel.includes(token)
    );
  });
}

