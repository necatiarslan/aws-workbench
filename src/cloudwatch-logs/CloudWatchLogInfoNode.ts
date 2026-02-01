import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';

export class CloudWatchLogInfoNode extends NodeBase {

    constructor(key: string, value: string, parent?: NodeBase) 
    {
        super(key, parent);
        this.Icon = "circle-outline";
        this.InfoKey = key;
        this.InfoValue = value;
        this.description = value;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        
        this.SetContextValue();
    }

    public InfoKey: string;
    public InfoValue: string;

    private async handleNodeOpen(): Promise<void> {
        // Copy value to clipboard
        await vscode.env.clipboard.writeText(this.InfoValue);
        ui.showInfoMessage(`Copied to clipboard: ${this.InfoValue}`);
    }
}
