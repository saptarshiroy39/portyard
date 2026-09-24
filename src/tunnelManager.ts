import { ChildProcess, spawn } from "child_process";
import * as vscode from "vscode";
import { ActivePort, killProcess } from "./portDiscovery";
import { ActivePortsProvider } from "./portTreeProvider";

export interface Tunnel {
  process: ChildProcess;
  url: string;
}

export const activeTunnels: Map<number, Tunnel> = new Map();

export function closeActiveTunnel(port: number, portsProvider?: ActivePortsProvider) {
  const tunnel = activeTunnels.get(port);
  if (tunnel) {
    activeTunnels.delete(port);
    try {
      if (tunnel.process.pid) {
        killProcess(tunnel.process.pid).catch(() => {
          try {
            tunnel.process.kill("SIGKILL");
          } catch {}
        });
      } else {
        tunnel.process.kill();
      }
    } catch {}
    if (portsProvider) {
      portsProvider.refresh();
    }
  }
}

export function createSshTunnel(
  portInfo: ActivePort,
  portsProvider: ActivePortsProvider,
): Thenable<void> {
  const port = portInfo.port;
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Generating instant SSH tunnel for port ${port}...`,
      cancellable: true,
    },
    (_progress, token) => {
      return new Promise<void>((resolve) => {
        let isCancelled = false;
        token.onCancellationRequested(() => {
          isCancelled = true;
          closeActiveTunnel(port, portsProvider);
          resolve();
        });

        closeActiveTunnel(port, portsProvider);

        const rawIp = (portInfo.ip || "localhost").trim();
        let targetHost = "localhost";

        const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        if (ipv4Regex.test(rawIp) && rawIp !== "127.0.0.1" && rawIp !== "0.0.0.0") {
          targetHost = rawIp;
        }

        const proc = spawn("ssh", [
          "-4",
          "-o",
          "ServerAliveInterval=15",
          "-o",
          "ServerAliveCountMax=3",
          "-o",
          "TCPKeepAlive=yes",
          "-o",
          "ExitOnForwardFailure=no",
          "-o",
          "StrictHostKeyChecking=accept-new",
          "-R",
          `80:${targetHost}:${port}`,
          "nokey@localhost.run",
        ]);

        let urlFound = false;
        let outputBuffer = "";

        const handleData = (chunk: string) => {
          if (urlFound || isCancelled) return;

          outputBuffer += chunk;
          if (outputBuffer.length > 20000) {
            outputBuffer = outputBuffer.slice(-10000);
          }

          const match =
            outputBuffer.match(/(https:\/\/[a-zA-Z0-9-.]+\.lhr\.life)/i) ||
            outputBuffer.match(/(https:\/\/[a-zA-Z0-9-.]+\.localhost\.run)/i);

          if (match && match[1]) {
            const url = match[1];
            if (url.includes("admin.localhost.run")) {
              return;
            }
            urlFound = true;

            activeTunnels.set(port, { process: proc, url });
            vscode.env.clipboard.writeText(url);
            portsProvider.refresh();

            vscode.window
              .showInformationMessage(
                `SSH Tunnel Active! Link copied: ${url}`,
                "Open in Browser",
                "Close Tunnel",
              )
              .then((choice) => {
                if (choice === "Open in Browser") {
                  vscode.env.openExternal(vscode.Uri.parse(url));
                } else if (choice === "Close Tunnel") {
                  closeActiveTunnel(port, portsProvider);
                  vscode.window.showInformationMessage(
                    `SSH tunnel for port ${port} terminated.`,
                  );
                }
              });

            resolve();
          }
        };

        proc.stdout?.setEncoding("utf8");
        proc.stdout?.on("data", handleData);
        proc.stderr?.setEncoding("utf8");
        proc.stderr?.on("data", handleData);

        proc.on("close", (code) => {
          activeTunnels.delete(port);
          portsProvider.refresh();
          if (!urlFound && !isCancelled) {
            const lastLine = outputBuffer.trim().split("\n").pop()?.trim();
            const reason = lastLine ? `: ${lastLine}` : ` (exit code ${code})`;
            vscode.window.showErrorMessage(
              `SSH Tunnel for port ${port} failed to start${reason}`,
            );
          }
          resolve();
        });

        proc.on("error", (err) => {
          activeTunnels.delete(port);
          portsProvider.refresh();
          if (!urlFound && !isCancelled) {
            vscode.window.showErrorMessage(
              `SSH Tunnel failed to launch: ${err.message}. Ensure OpenSSH client is installed and in your PATH.`,
            );
          }
          resolve();
        });
      });
    },
  );
}
