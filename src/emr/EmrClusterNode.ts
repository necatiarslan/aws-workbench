import * as vscode from "vscode";
import { Cluster } from "@aws-sdk/client-emr";
import { Serialize } from "../common/serialization/Serialize";
import { NodeBase } from "../tree/NodeBase";
import * as api from "./API";
import * as ui from "../common/UI";
import { EmrBootstrapActionsGroupNode } from "./EmrBootstrapActionsGroupNode";
import { EmrInfoGroupNode } from "./EmrInfoGroupNode";
import { EmrStepsGroupNode } from "./EmrStepsGroupNode";
import { EmrTagsGroupNode } from "./EmrTagsGroupNode";

export class EmrClusterNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) {
        super(label, parent);
        this.DefaultIcon = "server";
        this.DefaultIconColor = "charts.green";
        this.SetIcon();

        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());

        this.LoadDefaultChildren();
        this.SetContextValue();
    }

    public Region: string = "";

    public ClusterId: string = "";

    public ClusterName: string = "";

    public ClusterState: string = "";

    public ClusterCreatedAt: string = "";

    private _clusterConfig: Cluster | undefined = undefined;

    public get ClusterConfig(): Promise<Cluster | undefined> {
        return this.getClusterConfig();
    }

    private async getClusterConfig(): Promise<Cluster | undefined> {
        if (!this._clusterConfig && this.Region && this.ClusterId) {
            const result = await api.GetEmrCluster(this.Region, this.ClusterId);
            if (result.isSuccessful) {
                this._clusterConfig = result.result;
            } else {
                ui.logToOutput("api.GetEmrCluster Error !!!", result.error);
                ui.showErrorMessage("Get EMR Cluster Error !!!", result.error);
            }
        }

        return this._clusterConfig;
    }

    public async LoadDefaultChildren(): Promise<void> {
        new EmrInfoGroupNode("Info", this);
        new EmrStepsGroupNode("Steps", this);
        new EmrTagsGroupNode("Tags", this);
        new EmrBootstrapActionsGroupNode("Bootstrap Actions", this);
    }

    private async handleNodeRefresh(): Promise<void> {
        this._clusterConfig = undefined;
        for (const child of this.Children) {
            child.IsOnNodeLoadChildrenCalled = false;
            child.Children = [];
        }
        this.RefreshTree(this);
    }

    private async handleNodeInfo(): Promise<void> {
        if (!this.ClusterId || !this.Region) {
            ui.showWarningMessage("EMR cluster id or region is not set.");
            return;
        }

        if (this.IsWorking) {
            return;
        }

        this.StartWorking();

        try {
            const config = await this.ClusterConfig;
            if (!config) {
                ui.showWarningMessage("Failed to load EMR cluster configuration");
                return;
            }

            const jsonContent = JSON.stringify(config, null, 2);
            const document = await vscode.workspace.openTextDocument({
                content: jsonContent,
                language: "json",
            });
            await vscode.window.showTextDocument(document);
        } catch (error: any) {
            ui.logToOutput("EmrClusterNode.handleNodeInfo Error !!!", error);
            ui.showErrorMessage("Failed to open EMR cluster configuration", error);
        } finally {
            this.StopWorking();
        }
    }
}
