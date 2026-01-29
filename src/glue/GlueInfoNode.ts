import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';

export class GlueInfoNode extends NodeBase {

    public InfoKey: string;
    public InfoValue: string;

    constructor(key: string, value: string, parent?: NodeBase) {
        super(key, parent);
        this.Icon = "symbol-property";
        this.InfoKey = key;
        this.InfoValue = value;
        this.description = value;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        
        this.SetContextValue();
    }

    private async handleNodeOpen(): Promise<void> {
        // Copy value to clipboard
        await vscode.env.clipboard.writeText(this.InfoValue);
        ui.showInfoMessage(`Copied to clipboard: ${this.InfoValue}`);
    }
}
