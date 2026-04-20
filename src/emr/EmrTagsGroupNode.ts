import * as vscode from "vscode";
import * as ui from "../common/UI";
import { NodeBase } from "../tree/NodeBase";
import { EmrClusterNode } from "./EmrClusterNode";
import { EmrTagNode } from "./EmrTagNode";

export class EmrTagsGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = "tag";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        this.OnNodeRefresh.subscribe(() => this.handleLoadChildren());

        this.SetContextValue();
    }

    private async handleLoadChildren(): Promise<void> {
        const clusterNode = this.Parent as EmrClusterNode;
        if (!clusterNode) {
            return;
        }

        this.StartWorking();
        this.Children = [];

        try {
            const cluster = await clusterNode.ClusterConfig;
            const tags = cluster?.Tags ?? [];

            for (const tag of tags) {
                new EmrTagNode(tag.Key ?? "", tag.Value ?? "", this);
            }

            this.description = `${tags.length}`;
        } catch (error: any) {
            ui.logToOutput("EmrTagsGroupNode.handleLoadChildren Error !!!", error);
            ui.showErrorMessage("Failed to load EMR tags", error);
        } finally {
            this.StopWorking();
        }
    }
}
