import * as vscode from "vscode";
import * as ui from "../common/UI";
import { NodeBase } from "../tree/NodeBase";
import { S3Explorer } from "../s3/S3Explorer";

export class EmrStepNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = "circle-outline";
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;

        this.OnNodeCopy.subscribe(() => this.handleNodeCopy());
        this.OnNodeView.subscribe(() => this.handleNodeView());

        this.SetContextValue();
    }

    public StepId: string = "";
    public Status: string = "";
    public LogUri: string = "";

    private async handleNodeCopy(): Promise<void> {
        ui.CopyToClipboard(`${this.label} ${this.StepId}`);
        ui.showInfoMessage("Step details copied to clipboard");
    }
    private async handleNodeView(): Promise<void> {
        if (this.LogUri) {
            const bucket = this.LogUri.split("/")[2];
            const key = this.LogUri.split("/").slice(3).join("/");
            S3Explorer.Open(bucket, key);
        } else {
            ui.showInfoMessage("No LogUri available for this step");
        }

    }
}
