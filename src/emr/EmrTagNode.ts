import * as vscode from "vscode";
import * as ui from "../common/UI";
import { NodeBase } from "../tree/NodeBase";

export class EmrTagNode extends NodeBase {

    constructor(key: string, value: string, parent?: NodeBase) {
        super(key || "(empty-key)", parent);
        this.Icon = "circle-outline";
        this.Key = key;
        this.Value = value;
        this.description = value;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;

        this.OnNodeCopy.subscribe(() => this.handleNodeCopy());

        this.SetContextValue();
    }

    public Key: string = "";
    public Value: string = "";

    private async handleNodeCopy(): Promise<void> {
        const info = `${this.Key}: ${this.Value}`;
        ui.CopyToClipboard(info);
        ui.showInfoMessage(`Copied to clipboard: ${info}`);
    }
}
