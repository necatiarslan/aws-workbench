import * as vscode from "vscode";
import * as ui from "../common/UI";
import { NodeBase } from "../tree/NodeBase";

export class EmrBootstrapActionNode extends NodeBase {

    constructor(label: string, details: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = "circle-outline";
        this.Details = details;
        this.description = details;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;

        this.OnNodeCopy.subscribe(() => this.handleNodeCopy());

        this.SetContextValue();
    }

    public Details: string = "";

    private async handleNodeCopy(): Promise<void> {
        ui.CopyToClipboard(`${this.label} ${this.Details}`);
        ui.showInfoMessage("Bootstrap action details copied to clipboard");
    }
}
