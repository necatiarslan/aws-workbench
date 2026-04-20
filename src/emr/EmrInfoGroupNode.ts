import * as vscode from "vscode";
import * as ui from "../common/UI";
import { NodeBase } from "../tree/NodeBase";
import { EmrClusterNode } from "./EmrClusterNode";
import { EmrInfoNode } from "./EmrInfoNode";

export class EmrInfoGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = "info";
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
            if (!cluster) {
                return;
            }

            const infoItems: { key: string; value: string }[] = [
                { key: "Name", value: cluster.Name ?? clusterNode.ClusterName },
                { key: "Id", value: cluster.Id ?? clusterNode.ClusterId },
                { key: "Status", value: cluster.Status?.State ?? (clusterNode.ClusterState || "UNKNOWN") },
                { key: "Release Label", value: cluster.ReleaseLabel ?? "N/A" },
                { key: "Service Role", value: cluster.ServiceRole ?? "N/A" },
                { key: "Log Uri", value: cluster.LogUri ?? "N/A" },
                { key: "Created", value: cluster.Status?.Timeline?.CreationDateTime?.toISOString() ?? "N/A" },
                { key: "Ready", value: cluster.Status?.Timeline?.ReadyDateTime?.toISOString() ?? "N/A" },
                { key: "Ended", value: cluster.Status?.Timeline?.EndDateTime?.toISOString() ?? "N/A" },
            ];

            for (const item of infoItems) {
                new EmrInfoNode(item.key, item.value, this);
            }
        } catch (error: any) {
            ui.logToOutput("EmrInfoGroupNode.handleLoadChildren Error !!!", error);
            ui.showErrorMessage("Failed to load EMR cluster info", error);
        } finally {
            this.StopWorking();
        }
    }
}
