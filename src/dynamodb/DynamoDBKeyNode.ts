import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';

export class DynamoDBKeyNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) {
        super(Label, parent);
        this.Icon = "key";
        
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }

    public KeyName: string = "";
    public KeyType: string = "";
    public KeyRole: string = ""; // HASH or RANGE

    private handleNodeOpen(): void {
        // Copy key info to clipboard
        const info = `${this.KeyName} (${this.KeyType}) - ${this.KeyRole === 'HASH' ? 'Partition Key' : 'Sort Key'}`;
        vscode.env.clipboard.writeText(info);
        ui.showInfoMessage(`Copied to clipboard: ${info}`);
    }
}
