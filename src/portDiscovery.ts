import { exec } from 'child_process';
import * as os from 'os';

export interface ActivePort {
    port: number;
    pid: number;
    processName: string;
    protocol: 'TCP' | 'UDP';
    brand?: string;
}

const BRAND_PORTS: Record<number, string> = {
    5173: 'vite',
    4200: 'angular',
    80: 'http',
    443: 'https',
    5432: 'postgres',
    27017: 'mongodb',
    3306: 'mysql',
    6379: 'redis',
};

function getBrandForPort(
    port: number,
    processName: string,
): string | undefined {
    if (BRAND_PORTS[port]) {
        return BRAND_PORTS[port];
    }
    const lowerProcess = processName.toLowerCase();
    if (lowerProcess.includes('node') || lowerProcess.includes('vite'))
        return 'node';
    if (
        lowerProcess.includes('python') ||
        lowerProcess.includes('django') ||
        lowerProcess.includes('fastapi') ||
        lowerProcess.includes('uvicorn')
    )
        return 'python';
    if (lowerProcess.includes('docker')) return 'docker';
    // Exact match only — 'includes("go")' would false-positive on cargo, ergo, django, etc.
    if (lowerProcess === 'go' || lowerProcess === 'go.exe') return 'go';
    if (lowerProcess.includes('java')) return 'java';
    if (lowerProcess.includes('ruby') || lowerProcess.includes('rails'))
        return 'ruby';
    return undefined;
}

function getWindowsProcessMap(): Promise<Map<number, string>> {
    return new Promise((resolve) => {
        const processMap = new Map<number, string>();
        exec('tasklist /FO CSV /NH', (error, stdout) => {
            if (error || !stdout) {
                console.warn('[Portyard] tasklist failed:', error?.message);
                resolve(processMap);
                return;
            }
            for (const line of stdout.split('\n')) {
                const parts = line.split('","');
                if (parts.length >= 2) {
                    const name = parts[0].replace(/"/g, '').trim();
                    const pidStr = parts[1].replace(/"/g, '').trim();
                    const pid = parseInt(pidStr, 10);
                    if (!isNaN(pid)) {
                        processMap.set(pid, name);
                    }
                }
            }
            resolve(processMap);
        });
    });
}

async function discoverWindows(): Promise<ActivePort[]> {
    const processMap = await getWindowsProcessMap();
    return new Promise((resolve) => {
        exec('netstat -ano', (error, stdout) => {
            if (error || !stdout) {
                resolve([]);
                return;
            }
            const portsMap = new Map<string, ActivePort>();
            for (const line of stdout.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('TCP') && !trimmed.startsWith('UDP'))
                    continue;

                const tokens = trimmed.split(/\s+/);
                if (tokens.length >= 4) {
                    const protocol = tokens[0] as 'TCP' | 'UDP';
                    const localAddress = tokens[1];
                    const state = protocol === 'TCP' ? tokens[3] : 'LISTENING';
                    const pidStr = protocol === 'TCP' ? tokens[4] : tokens[3];
                    const pid = parseInt(pidStr, 10);

                    if (state !== 'LISTENING' || isNaN(pid)) continue;

                    const lastColonIndex = localAddress.lastIndexOf(':');
                    if (lastColonIndex === -1) continue;

                    const portStr = localAddress.substring(lastColonIndex + 1);
                    const port = parseInt(portStr, 10);
                    if (isNaN(port) || port === 0) continue;

                    const processName = processMap.get(pid) || 'Unknown';
                    const key = `${protocol}-${port}`;

                    if (!portsMap.has(key)) {
                        portsMap.set(key, {
                            port,
                            pid,
                            processName,
                            protocol,
                            brand: getBrandForPort(port, processName),
                        });
                    }
                }
            }
            resolve(
                Array.from(portsMap.values()).sort((a, b) => a.port - b.port),
            );
        });
    });
}

function discoverUnix(): Promise<ActivePort[]> {
    return new Promise((resolve) => {
        exec('lsof -iTCP -sTCP:LISTEN -P -n', (error, stdout) => {
            if (error || !stdout) {
                resolve([]);
                return;
            }
            const portsMap = new Map<string, ActivePort>();
            const lines = stdout.split('\n');
            for (let i = 1; i < lines.length; i++) {
                const trimmed = lines[i].trim();
                if (!trimmed) continue;

                const tokens = trimmed.split(/\s+/);
                if (tokens.length >= 9) {
                    const processName = tokens[0];
                    const pid = parseInt(tokens[1], 10);
                    const name = tokens[8];

                    if (isNaN(pid)) continue;

                    const lastColonIndex = name.lastIndexOf(':');
                    if (lastColonIndex === -1) continue;

                    const portStr = name.substring(lastColonIndex + 1);
                    const port = parseInt(portStr, 10);
                    if (isNaN(port) || port === 0) continue;

                    const key = `TCP-${port}`;
                    if (!portsMap.has(key)) {
                        portsMap.set(key, {
                            port,
                            pid,
                            processName,
                            protocol: 'TCP',
                            brand: getBrandForPort(port, processName),
                        });
                    }
                }
            }
            resolve(
                Array.from(portsMap.values()).sort((a, b) => a.port - b.port),
            );
        });
    });
}

export function discoverActivePorts(): Promise<ActivePort[]> {
    return os.platform() === 'win32' ? discoverWindows() : discoverUnix();
}

export function killProcess(pid: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const isWindows = os.platform() === 'win32';
        const cmd = isWindows
            ? `taskkill /F /T /PID ${pid}`
            : `kill -9 -${pid}`;

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
        'system',
        'svchost.exe',
        'lsass.exe',
        'spoolsv.exe',
        'services.exe',
        'wininit.exe',
        'jhi_service.exe',
        'ss_conn_service.exe',
        'ss_conn_service2.exe',
        'alg.exe',
        'smss.exe',
        'csrss.exe',
        'searchhost.exe',
        'startmenuexperiencehost.exe',
        'dashost.exe',
        'fontdrvhost.exe',
        'code.exe',
        'code',
    ];
    if (systemProcesses.includes(lowerProcess)) return true;
    if ([135, 137, 138, 139, 445].includes(port)) return true;
    return port >= 49152;
}
