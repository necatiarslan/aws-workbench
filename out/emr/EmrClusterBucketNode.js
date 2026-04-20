"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmrClusterBucketNode = void 0;
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
const NodeBase_1 = require("../tree/NodeBase");
const api = __importStar(require("./API"));
const EmrClusterNode_1 = require("./EmrClusterNode");
const ACTIVE_STATES = new Set([
    "STARTING",
    "BOOTSTRAPPING",
    "RUNNING",
    "WAITING",
    "TERMINATING",
]);
const TERMINATED_STATES = new Set([
    "TERMINATED",
    "TERMINATED_WITH_ERRORS",
]);
class EmrClusterBucketNode extends NodeBase_1.NodeBase {
    constructor(label, bucketType, parent) {
        super(label, parent);
        this.Icon = "folder";
        this.BucketType = bucketType;
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        this.SetContextValue();
    }
    BucketType;
    async handleNodeRefresh() {
        this.Children = [];
        this.IsOnNodeLoadChildrenCalled = false;
        await this.handleLoadChildren();
    }
    async handleLoadChildren() {
        const emrNode = this.Parent;
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
                const node = new EmrClusterNode_1.EmrClusterNode(`${name} (${id})`, this);
                node.Region = emrNode.Region;
                node.ClusterName = name;
                node.ClusterId = id;
                node.ClusterState = cluster.Status?.State ?? "UNKNOWN";
                node.ClusterCreatedAt = cluster.Status?.Timeline?.CreationDateTime?.toISOString() ?? "";
            }
            this.description = `${filteredClusters.length}`;
        }
        catch (error) {
            ui.logToOutput("EmrClusterBucketNode.handleLoadChildren Error !!!", error);
            ui.showErrorMessage("Failed to load EMR clusters", error);
        }
        finally {
            this.StopWorking();
        }
    }
    matchesBucket(cluster) {
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
    getTodayRange(now) {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return { start, end };
    }
    getThisWeekRange(now) {
        const start = this.getStartOfWeek(now);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        return { start, end };
    }
    getPrevWeekRange(now) {
        const thisWeekStart = this.getStartOfWeek(now);
        const prevWeekStart = new Date(thisWeekStart);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        return { start: prevWeekStart, end: thisWeekStart };
    }
    getStartOfWeek(date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const day = start.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + diffToMonday);
        return start;
    }
    isBetween(value, start, end) {
        return value.getTime() >= start.getTime() && value.getTime() < end.getTime();
    }
}
exports.EmrClusterBucketNode = EmrClusterBucketNode;
//# sourceMappingURL=EmrClusterBucketNode.js.map