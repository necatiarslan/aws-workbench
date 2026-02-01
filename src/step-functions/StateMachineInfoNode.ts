import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';

export class StateMachineInfoNode extends NodeBase {

    constructor(key: string, value: string, parent?: NodeBase) 
    {
        super(key, parent);
        this.Icon = "circle-outline";
        this.InfoKey = key;
        this.InfoValue = value;
        this.description = value;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        
        this.OnNodeCopy.subscribe(() => this.handleNodeCopy());
        
        this.SetContextValue();
    }

    public InfoKey: string;
    public InfoValue: string;

    private async handleNodeCopy(): Promise<void> {
        // Copy value to clipboard
        ui.CopyToClipboard(this.InfoValue);
        ui.showInfoMessage(`Copied to clipboard: ${this.InfoValue}`);
    }
}
