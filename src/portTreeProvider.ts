import * as vscode from "vscode";
import { discoverActivePorts, ActivePort, isSystemPort } from "./portDiscovery";
import { getBrandColor, getBrandIcon } from "./brandUtils";

export class PortTreeItem extends vscode.TreeItem {
  constructor(
    public readonly portInfo: ActivePort,
    public readonly tunnelInfo?: { url: string },
  ) {
    super(`:${portInfo.port}`, vscode.TreeItemCollapsibleState.None);

    this.description = `${portInfo.processName} (#${portInfo.pid})`;

    if (tunnelInfo) {
      this.contextValue = "sharedPort";
    } else {
      this.contextValue = "activePort";
    }

    this.tooltip = this.getTooltipText();
    this.iconPath = this.getIcon();
  }

  private getTooltipText(): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.supportThemeIcons = true;
    md.appendMarkdown(`$(radio-tower) Port: ${this.portInfo.port}  \n`);
    md.appendMarkdown(`$(terminal) Process: ${this.portInfo.processName}  \n`);
    md.appendMarkdown(`$(symbol-numeric) PID: ${this.portInfo.pid}  \n`);
    md.appendMarkdown(`$(globe) Protocol: ${this.portInfo.protocol}`);
    if (this.portInfo.brand) {
      md.appendMarkdown(
        `  \n$(code) Technology: ${this.portInfo.brand.toUpperCase()}`,
      );
    }
    if (this.tunnelInfo) {
      md.appendMarkdown(
        `  \n$(link) Public URL: [${this.tunnelInfo.url}](${this.tunnelInfo.url})`,
      );
    }
    return md;
  }

  private getIcon(): vscode.ThemeIcon {
    const iconName = getBrandIcon(this.portInfo.brand, !!this.tunnelInfo);
    return new vscode.ThemeIcon(
      iconName,
      new vscode.ThemeColor(getBrandColor(this.portInfo.brand)),
    );
  }
}

export class ActivePortsProvider implements vscode.TreeDataProvider<PortTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    PortTreeItem | undefined | null | void
  > = new vscode.EventEmitter<PortTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    PortTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  public showSystemPorts: boolean = false;

  constructor(
    private readonly getTunnelInfo?: (
      port: number,
    ) => { url: string } | undefined,
  ) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: PortTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: PortTreeItem): Promise<PortTreeItem[]> {
    if (element) return [];
    try {
      let ports = await discoverActivePorts();
      if (!this.showSystemPorts) {
        ports = ports.filter(
          (port) => !isSystemPort(port.port, port.processName),
        );
      }
      return ports.map((port) => {
        const tunnelInfo = this.getTunnelInfo
          ? this.getTunnelInfo(port.port)
          : undefined;
        return new PortTreeItem(port, tunnelInfo);
      });
    } catch (error: any) {
      vscode.window.showErrorMessage(
        `Failed to discover active ports: ${error.message}`,
      );
      return [];
    }
  }
}
