import * as vscode from 'vscode';
import { discoverActivePorts, ActivePort, isSystemPort } from './portDiscovery';
import { getBrandColor } from './brandUtils';

export class PortTreeItem extends vscode.TreeItem {
    constructor(public readonly portInfo: ActivePort) {
        super(`:${portInfo.port}`, vscode.TreeItemCollapsibleState.None);

        const italicName = toUnicodeItalic(portInfo.processName);
        this.description = `${italicName} (PID: ${portInfo.pid})`;

        this.tooltip = this.getTooltipText();
        this.iconPath = this.getIcon();
        this.contextValue = 'activePort';

        const brandQuery = portInfo.brand
            ? `brand=${portInfo.brand}`
            : 'brand=generic';
        this.resourceUri = vscode.Uri.parse(
            `portyard-port:${portInfo.port}?${brandQuery}`,
        );
    }

    private getTooltipText(): vscode.MarkdownString {
        const md = new vscode.MarkdownString();
        md.supportThemeIcons = true;
        md.appendMarkdown(`$(radio-tower) Port: ${this.portInfo.port}\n\n`);
        md.appendMarkdown(
            `$(terminal) Process: ${this.portInfo.processName}\n\n`,
        );
        md.appendMarkdown(`$(symbol-numeric) PID: ${this.portInfo.pid}\n\n`);
        md.appendMarkdown(`$(globe) Protocol: ${this.portInfo.protocol}\n\n`);
        if (this.portInfo.brand) {
            md.appendMarkdown(
                `$(code) Technology: ${this.portInfo.brand.toUpperCase()}\n\n`,
            );
        }
        return md;
    }

    private getIcon(): vscode.ThemeIcon {
        return new vscode.ThemeIcon(
            'plug',
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
            return ports.map((port) => new PortTreeItem(port));
        } catch (error: any) {
            vscode.window.showErrorMessage(
                `Failed to discover active ports: ${error.message}`,
            );
            return [];
        }
    }
}

function toUnicodeItalic(str: string): string {
    return str
        .split('')
        .map((char) => {
            const code = char.charCodeAt(0);
            if (code >= 97 && code <= 122) {
                return String.fromCodePoint(0x1d622 + (code - 97));
            }
            if (code >= 65 && code <= 90) {
                return String.fromCodePoint(0x1d608 + (code - 65));
            }
            return char;
        })
        .join('');
}
