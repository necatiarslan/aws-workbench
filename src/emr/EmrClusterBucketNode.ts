import * as vscode from "vscode";
import * as ui from "../common/UI";
import { ClusterState, ClusterSummary } from "@aws-sdk/client-emr";
import { NodeBase } from "../tree/NodeBase";
import * as api from "./API";
import { EmrClusterNode } from "./EmrClusterNode";
import { EmrNode } from "./EmrNode";

export type EmrBucketType = "today-active" | "today-terminated" | "this-week" | "prev-week";

const ACTIVE_STATES: Set<ClusterState> = new Set([
    "STARTING",
    "BOOTSTRAPPING",
    "RUNNING",
    "WAITING",
    "TERMINATING",
]);

const TERMINATED_STATES: Set<ClusterState> = new Set([
    "TERMINATED",
    "TERMINATED_WITH_ERRORS",
]);

export class EmrClusterBucketNode extends NodeBase {

    constructor(label: string, bucketType: EmrBucketType, parent?: NodeBase) {
        super(label, parent);
        this.Icon = "folder";
        this.BucketType = bucketType;
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());

        this.SetContextValue();
    }

    public BucketType: EmrBucketType;

    private async handleNodeRefresh(): Promise<void> {
        this.Children = [];
        this.IsOnNodeLoadChildrenCalled = false;
        await this.handleLoadChildren();
    }

    private async handleLoadChildren(): Promise<void> {
        const emrNode = this.Parent as EmrNode;
        if (!emrNode || !emrNode.Region || !emrNode.SearchKey) {
            return;
        }

        this.StartWorking();
        this.Children = [];

        try {
            const result = await api.GetEmrClusterList(emrNode.Region, emrNode.SearchKey);
            if (!result.isSuccessful) {
                return;
            }

            const filteredClusters = result.result.filter(cluster => this.matchesBucket(cluster));
            for (const cluster of filteredClusters) {
                const name = cluster.Name ?? "UnnamedCluster";
                const id = cluster.Id ?? "UnknownId";
                const node = new EmrClusterNode(`${name} (${id})`, this);
                node.Region = emrNode.Region;
                node.ClusterName = name;
                node.ClusterId = id;
                node.ClusterState = cluster.Status?.State ?? "UNKNOWN";
                node.ClusterCreatedAt = cluster.Status?.Timeline?.CreationDateTime?.toISOString() ?? "";
            }

            this.description = `${filteredClusters.length}`;
        } catch (error: any) {
            ui.logToOutput("EmrClusterBucketNode.handleLoadChildren Error !!!", error);
            ui.showErrorMessage("Failed to load EMR clusters", error);
        } finally {
            this.StopWorking();
        }
    }

    private matchesBucket(cluster: ClusterSummary): boolean {
        const createdAt = cluster.Status?.Timeline?.CreationDateTime;
        if (!createdAt) {
            return false;
        }

        const state = cluster.Status?.State;
        const now = new Date();
        const todayRange = this.getTodayRange(now);
        const thisWeekRange = this.getThisWeekRange(now);
        const prevWeekRange = this.getPrevWeekRange(now);

        if (this.BucketType === "today-active") {
            return this.isBetween(createdAt, todayRange.start, todayRange.end) && !!state && ACTIVE_STATES.has(state);
        }

        if (this.BucketType === "today-terminated") {
            return this.isBetween(createdAt, todayRange.start, todayRange.end) && !!state && TERMINATED_STATES.has(state);
        }

        if (this.BucketType === "this-week") {
            return this.isBetween(createdAt, thisWeekRange.start, thisWeekRange.end);
        }

        return this.isBetween(createdAt, prevWeekRange.start, prevWeekRange.end);
    }

    private getTodayRange(now: Date): { start: Date; end: Date } {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return { start, end };
    }

    private getThisWeekRange(now: Date): { start: Date; end: Date } {
        const start = this.getStartOfWeek(now);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        return { start, end };
    }

    private getPrevWeekRange(now: Date): { start: Date; end: Date } {
        const thisWeekStart = this.getStartOfWeek(now);
        const prevWeekStart = new Date(thisWeekStart);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        return { start: prevWeekStart, end: thisWeekStart };
    }

    private getStartOfWeek(date: Date): Date {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);

        const day = start.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + diffToMonday);
        return start;
    }

    private isBetween(value: Date, start: Date, end: Date): boolean {
        return value.getTime() >= start.getTime() && value.getTime() < end.getTime();
    }
}
