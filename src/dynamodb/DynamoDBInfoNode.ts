import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';

export class DynamoDBInfoNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) {
        super(Label, parent);
        this.Icon = "circle-outline";
        
        this.OnNodeCopy.subscribe(() => this.handleNodeCopy());
        
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }

    public InfoKey: string = "";
    public InfoValue: string = "";

    private handleNodeCopy(): void {
        ui.CopyToClipboard(this.InfoValue);
        ui.showInfoMessage(`Copied to clipboard: ${this.InfoValue}`);
    }
}
