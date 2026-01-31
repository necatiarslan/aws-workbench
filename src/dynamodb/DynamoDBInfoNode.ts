import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';

export class DynamoDBInfoNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) {
        super(Label, parent);
        this.Icon = "circle-outline";
        
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }

    public InfoKey: string = "";
    public InfoValue: string = "";

    private handleNodeOpen(): void {
        vscode.env.clipboard.writeText(this.InfoValue);
        ui.showInfoMessage(`Copied to clipboard: ${this.InfoValue}`);
    }
}
