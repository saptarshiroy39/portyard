import * as vscode from "vscode";
import { ActivePortsProvider, PortTreeItem } from "./portTreeProvider";
import { killProcess } from "./portDiscovery";
import { getBrandColor } from "./brandUtils";
import { spawn, ChildProcess } from "child_process";

const activeTunnels: Map<number, { process: ChildProcess; url: string }> =
  new Map();

export function activate(context: vscode.ExtensionContext) {
  const portsProvider = new ActivePortsProvider((port) =>
    activeTunnels.get(port),
  );
  portsProvider.showSystemPorts = false;
  vscode.commands.executeCommand(
    "setContext",
    "portyard:showSystemPorts",
    false,
  );

  const treeView = vscode.window.createTreeView("portyard-ports-view", {
    treeDataProvider: portsProvider,
  });

  let autoRefreshInterval: NodeJS.Timeout | undefined;

  const startPolling = () => {
    if (!autoRefreshInterval) {
      portsProvider.refresh();
      autoRefreshInterval = setInterval(() => {
        portsProvider.refresh();
      }, 5000);
    }
  };

  const stopPolling = () => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = undefined;
    }
  };

  if (treeView.visible) {
    startPolling();
  }

  const visibilitySubscription = treeView.onDidChangeVisibility((e) => {
    if (e.visible) {
      startPolling();
    } else {
      stopPolling();
    }
  });

  context.subscriptions.push(
    treeView,
    visibilitySubscription,
    new vscode.Disposable(() => {
      stopPolling();
    }),
  );

  const refreshCommand = vscode.commands.registerCommand(
    "portyard.refreshPorts",
    () => {
      portsProvider.refresh();
    },
  );

  const showSystemCommand = vscode.commands.registerCommand(
    "portyard.showSystem",
    () => {
      portsProvider.showSystemPorts = true;
      vscode.commands.executeCommand(
        "setContext",
        "portyard:showSystemPorts",
        true,
      );
      portsProvider.refresh();
    },
  );

  const hideSystemCommand = vscode.commands.registerCommand(
    "portyard.hideSystem",
    () => {
      portsProvider.showSystemPorts = false;
      vscode.commands.executeCommand(
        "setContext",
        "portyard:showSystemPorts",
        false,
      );
      portsProvider.refresh();
    },
  );

  const killCommand = vscode.commands.registerCommand(
    "portyard.killPortProcess",
    async (item: PortTreeItem) => {
      if (!item || !item.portInfo) return;

      const confirm = await vscode.window.showWarningMessage(
        `Are you sure you want to stop the process "${item.portInfo.processName}" (PID: ${item.portInfo.pid}) running on port ${item.portInfo.port}?`,
        { modal: true },
        "Stop Process",
      );
      if (confirm !== "Stop Process") return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Stopping process running on port ${item.portInfo.port}...`,
          cancellable: false,
        },
        async () => {
          try {
            await killProcess(item.portInfo.pid);
            closeActiveTunnel(item.portInfo.port, portsProvider);
            vscode.window.showInformationMessage(
              `Successfully stopped process running on port ${item.portInfo.port}.`,
            );
            portsProvider.refresh();
          } catch (error: any) {
            vscode.window.showErrorMessage(
              `Failed to stop process. You may need administrator privileges to terminate this process. Error: ${error.message}`,
            );
          }
        },
      );
    },
  );

  const openCommand = vscode.commands.registerCommand(
    "portyard.openInBrowser",
    async (item: PortTreeItem) => {
      if (!item || !item.portInfo) return;
      const uri = vscode.Uri.parse(`http://localhost:${item.portInfo.port}`);
      try {
        await vscode.env.openExternal(uri);
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `Failed to open browser: ${error.message}`,
        );
      }
    },
  );

  const forwardCommand = vscode.commands.registerCommand(
    "portyard.forwardPort",
    async (item: PortTreeItem) => {
      if (!item || !item.portInfo) return;

      const port = item.portInfo.port;
      const activeTunnel = activeTunnels.get(port);

      if (activeTunnel) {
        const selection = await vscode.window.showQuickPick(
          [
            {
              label: "$(copy) Copy Public URL to Clipboard",
              description: activeTunnel.url,
              action: "copy",
            },
            {
              label: "$(globe) Open Public URL in Browser",
              description: activeTunnel.url,
              action: "open",
            },
            {
              label: "$(circle-slash) Terminate SSH Tunnel",
              description: "Stops the running localhost.run forwarding tunnel.",
              action: "stop",
            },
          ],
          {
            placeHolder: `SSH Tunnel for port ${port} is active`,
          },
        );

        if (!selection) return;

        if (selection.action === "copy") {
          vscode.env.clipboard.writeText(activeTunnel.url);
          vscode.window.showInformationMessage(
            `Copied tunnel URL to clipboard: ${activeTunnel.url}`,
          );
        } else if (selection.action === "open") {
          vscode.env.openExternal(vscode.Uri.parse(activeTunnel.url));
        } else if (selection.action === "stop") {
          closeActiveTunnel(port, portsProvider);
          vscode.window.showInformationMessage(
            `SSH tunnel for port ${port} has been terminated.`,
          );
        }
        return;
      }
      createSshTunnel(port, portsProvider);
    },
  );

  const unshareCommand = vscode.commands.registerCommand(
    "portyard.unsharePort",
    async (item: PortTreeItem) => {
      if (!item || !item.portInfo) return;
      const port = item.portInfo.port;
      closeActiveTunnel(port, portsProvider);
      vscode.window.showInformationMessage(
        `SSH tunnel for port ${port} has been terminated.`,
      );
    },
  );

  const copySharedUrlCommand = vscode.commands.registerCommand(
    "portyard.copySharedUrl",
    async (item: PortTreeItem) => {
      if (!item || !item.portInfo) return;
      const port = item.portInfo.port;
      const activeTunnel = activeTunnels.get(port);
      if (activeTunnel) {
        vscode.env.clipboard.writeText(activeTunnel.url);
        vscode.window.showInformationMessage(
          `Copied tunnel URL to clipboard: ${activeTunnel.url}`,
        );
      }
    },
  );

  const openSharedUrlCommand = vscode.commands.registerCommand(
    "portyard.openSharedUrl",
    async (item: PortTreeItem) => {
      if (!item || !item.portInfo) return;
      const port = item.portInfo.port;
      const activeTunnel = activeTunnels.get(port);
      if (activeTunnel) {
        vscode.env.openExternal(vscode.Uri.parse(activeTunnel.url));
      }
    },
  );

  context.subscriptions.push(
    refreshCommand,
    showSystemCommand,
    hideSystemCommand,
    killCommand,
    openCommand,
    forwardCommand,
    unshareCommand,
    copySharedUrlCommand,
    openSharedUrlCommand,
    vscode.window.registerFileDecorationProvider(
      new PortFileDecorationProvider(),
    ),
  );
}

function closeActiveTunnel(port: number, portsProvider?: ActivePortsProvider) {
  const tunnel = activeTunnels.get(port);
  if (tunnel) {
    if (tunnel.process.pid) {
      killProcess(tunnel.process.pid).catch(() => {
        tunnel.process.kill("SIGKILL");
      });
    } else {
      tunnel.process.kill();
    }
    activeTunnels.delete(port);
    if (portsProvider) {
      portsProvider.refresh();
    }
  }
}

function createSshTunnel(
  port: number,
  portsProvider: ActivePortsProvider,
): Thenable<void> {
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

        const proc = spawn("ssh", [
          "-o",
          "StrictHostKeyChecking=accept-new",
          "-R",
          `80:127.0.0.1:${port}`,
          "nokey@localhost.run",
        ]);

        let urlFound = false;

        const handleData = (data: string) => {
          if (urlFound || isCancelled) return;

          const match =
            data.match(/(https:\/\/[a-zA-Z0-9-.]+\.lhr\.life)/i) ||
            data.match(/(https:\/\/[a-zA-Z0-9-.]+\.localhost\.run)/i) ||
            data.match(/(https:\/\/[^\s]+)/);

          if (match && match[1]) {
            urlFound = true;
            const url = match[1];

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

        proc.on("close", () => {
          activeTunnels.delete(port);
          portsProvider.refresh();
          resolve();
        });

        proc.on("error", (err) => {
          activeTunnels.delete(port);
          portsProvider.refresh();
          if (!urlFound && !isCancelled) {
            vscode.window.showErrorMessage(
              `SSH Tunnel failed to launch: ${err.message}`,
            );
            resolve();
          }
        });
      });
    },
  );
}

export function deactivate() {
  for (const port of Array.from(activeTunnels.keys())) {
    closeActiveTunnel(port);
  }
}

class PortFileDecorationProvider implements vscode.FileDecorationProvider {
  provideFileDecoration(
    uri: vscode.Uri,
  ): vscode.ProviderResult<vscode.FileDecoration> {
    if (uri.scheme !== "portyard-port") {
      return undefined;
    }
    const match = uri.query.match(/brand=([^&]+)/);
    const brand = match ? match[1] : undefined;
    return {
      color: new vscode.ThemeColor(getBrandColor(brand)),
    };
  }
}
