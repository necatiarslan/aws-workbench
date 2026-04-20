import * as vscode from "vscode";
import * as ui from "../common/UI";
import { NodeBase } from "../tree/NodeBase";
import * as api from "./API";
import { EmrClusterNode } from "./EmrClusterNode";
import { EmrStepNode } from "./EmrStepNode";

export class EmrStepsGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) {
        super(label, parent);
        this.Icon = "symbol-number";
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
            const result = await api.GetEmrClusterSteps(clusterNode.Region, clusterNode.ClusterId);
            if (!result.isSuccessful) {
                return;
            }

            for (const step of result.result) {
                const stepName = step.Name ?? "UnnamedStep";
                const stepId = step.Id ?? "UnknownId";
                const status = step.Status?.State ?? "UNKNOWN";
                const label = `${stepName} (${stepId}-${status})`;
                const description = `${status}`;
                let stepNode = new EmrStepNode(label, this);
                stepNode.StepId = stepId;
                stepNode.Status = status;
                stepNode.LogUri = step.LogUri ?? "";
            }

            this.description = `${result.result.length}`;
        } catch (error: any) {
            ui.logToOutput("EmrStepsGroupNode.handleLoadChildren Error !!!", error);
            ui.showErrorMessage("Failed to load EMR steps", error);
        } finally {
            this.StopWorking();
        }
    }
}
