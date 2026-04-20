import * as vscode from "vscode";
import * as ui from "../common/UI";
import { NodeBase } from "../tree/NodeBase";
import * as api from "./API";
import { EmrBootstrapActionNode } from "./EmrBootstrapActionNode";
import { EmrClusterNode } from "./EmrClusterNode";

export class EmrBootstrapActionsGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = "tools";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        this.OnNodeRefresh.subscribe(() => this.handleLoadChildren());

        this.SetContextValue();
    }

    private async handleLoadChildren(): Promise<void> {
        const clusterNode = this.Parent as EmrClusterNode;
        if (!clusterNode || !clusterNode.Region || !clusterNode.ClusterId) {
            return;
        }

        this.StartWorking();
        this.Children = [];

        try {
            const result = await api.GetEmrClusterBootstrapActions(clusterNode.Region, clusterNode.ClusterId);
            if (!result.isSuccessful) {
                return;
            }

            for (const action of result.result) {
                const actionName = action.Name ?? "UnnamedAction";
                const path = action.ScriptPath ?? "N/A";
                const args = action.Args?.join(" ") ?? "";
                const description = args.length > 0 ? `${path} ${args}` : path;
                new EmrBootstrapActionNode(actionName, description, this);
            }

            this.description = `${result.result.length}`;
        } catch (error: any) {
            ui.logToOutput("EmrBootstrapActionsGroupNode.handleLoadChildren Error !!!", error);
            ui.showErrorMessage("Failed to load EMR bootstrap actions", error);
        } finally {
            this.StopWorking();
        }
    }
}
