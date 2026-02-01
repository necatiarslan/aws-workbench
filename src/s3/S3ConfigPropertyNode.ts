import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';

export class S3ConfigPropertyNode extends NodeBase {

    constructor(label: string, value: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = 'circle-outline';
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.description = value;
        this.Value = value;

        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());

        this.SetContextValue();
    }

    public Value: string = "";

    private handleNodeInfo(): void {
        ui.logToOutput(`S3ConfigPropertyNode Info: ${this.label} = ${this.Value}`);
        ui.showInfoMessage(`${this.label}: ${this.Value}`);
    }
}
