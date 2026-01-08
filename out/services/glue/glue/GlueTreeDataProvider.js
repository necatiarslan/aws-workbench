"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueTreeDataProvider = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const GlueTreeItem_1 = require("./GlueTreeItem");
const GlueService_1 = require("../GlueService");
class GlueTreeDataProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    constructor() { }
    Refresh(node) {
        this._onDidChangeTreeData.fire(node);
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (element) {
            if (element.TreeItemType === GlueTreeItem_1.TreeItemType.Job) {
                return [
                    new GlueTreeItem_1.GlueTreeItem("Info", GlueTreeItem_1.TreeItemType.Info, element.Region, element.ResourceName, vscode.TreeItemCollapsibleState.Collapsed, undefined, element),
                    new GlueTreeItem_1.GlueTreeItem("Runs", GlueTreeItem_1.TreeItemType.RunGroup, element.Region, element.ResourceName, vscode.TreeItemCollapsibleState.Collapsed, undefined, element),
                    new GlueTreeItem_1.GlueTreeItem("/aws-glue/jobs/output", GlueTreeItem_1.TreeItemType.LogGroup, element.Region, element.ResourceName, vscode.TreeItemCollapsibleState.Collapsed, undefined, element),
                    new GlueTreeItem_1.GlueTreeItem("/aws-glue/jobs/error", GlueTreeItem_1.TreeItemType.LogGroup, element.Region, element.ResourceName, vscode.TreeItemCollapsibleState.Collapsed, undefined, element)
                ];
            }
            if (element.TreeItemType === GlueTreeItem_1.TreeItemType.Info) {
                let jobInfo = element.Payload || GlueService_1.GlueService.Instance.JobInfoCache[element.ResourceName];
                if (!jobInfo)
                    return [new GlueTreeItem_1.GlueTreeItem("No Data (Refresh to Load)", GlueTreeItem_1.TreeItemType.Detail, element.Region, "", vscode.TreeItemCollapsibleState.None, undefined, element)];
                let nodes = [];
                for (let key in jobInfo) {
                    let val = jobInfo[key];
                    if (typeof val === 'object' && val !== null) {
                        nodes.push(new GlueTreeItem_1.GlueTreeItem(`${key}: ...`, GlueTreeItem_1.TreeItemType.Info, element.Region, element.ResourceName, vscode.TreeItemCollapsibleState.Collapsed, undefined, element, val));
                    }
                    else {
                        nodes.push(new GlueTreeItem_1.GlueTreeItem(`${key}: ${val}`, GlueTreeItem_1.TreeItemType.Detail, element.Region, "", vscode.TreeItemCollapsibleState.None, undefined, element));
                    }
                }
                return nodes;
            }
            if (element.TreeItemType === GlueTreeItem_1.TreeItemType.RunGroup) {
                // Runs will be added dynamically by RefreshRuns
                let runs = element.Payload;
                if (element.Parent && GlueService_1.GlueService.Instance.JobRunsCache[element.Parent.ResourceName]) {
                    runs = GlueService_1.GlueService.Instance.JobRunsCache[element.Parent.ResourceName];
                }
                if (!runs)
                    return [];
                if (runs.length === 0)
                    return [new GlueTreeItem_1.GlueTreeItem("No Runs Found", GlueTreeItem_1.TreeItemType.Detail, element.Region, "", vscode.TreeItemCollapsibleState.None, undefined, element)];
                return runs.map(run => {
                    let runLabel = `${run.Id} (${run.JobRunState})`;
                    return new GlueTreeItem_1.GlueTreeItem(runLabel, GlueTreeItem_1.TreeItemType.Run, element.Region, run.Id, vscode.TreeItemCollapsibleState.Collapsed, undefined, element, run);
                });
            }
            if (element.TreeItemType === GlueTreeItem_1.TreeItemType.LogGroup) {
                // Log streams will be added dynamically by RefreshLogStreams
                let streams = GlueService_1.GlueService.Instance.LogStreamsCache[element.label];
                if (!streams)
                    return [];
                if (streams.length === 0)
                    return [new GlueTreeItem_1.GlueTreeItem("No Logs Found", GlueTreeItem_1.TreeItemType.Detail, element.Region, "", vscode.TreeItemCollapsibleState.None, undefined, element)];
                return streams.map(s => new GlueTreeItem_1.GlueTreeItem(s, GlueTreeItem_1.TreeItemType.LogStream, element.Region, s, vscode.TreeItemCollapsibleState.None, undefined, element));
            }
            if (element.TreeItemType === GlueTreeItem_1.TreeItemType.Run) {
                if (!element.Payload)
                    return [];
                let run = element.Payload;
                let children = [];
                // Log nodes
                let outLog = new GlueTreeItem_1.GlueTreeItem("View Output Logs", GlueTreeItem_1.TreeItemType.LogStream, element.Region, run.Id, vscode.TreeItemCollapsibleState.None, undefined, element, { LogGroupName: "/aws-glue/jobs/output" });
                outLog.command = { command: 'GlueTreeView.ViewLog', title: 'View Log', arguments: [outLog] };
                children.push(outLog);
                let errLog = new GlueTreeItem_1.GlueTreeItem("View Error Logs", GlueTreeItem_1.TreeItemType.LogStream, element.Region, run.Id, vscode.TreeItemCollapsibleState.None, undefined, element, { LogGroupName: "/aws-glue/jobs/error" });
                errLog.command = { command: 'GlueTreeView.ViewLog', title: 'View Log', arguments: [errLog] };
                children.push(errLog);
                // Arguments node
                if (run.Arguments) {
                    children.push(new GlueTreeItem_1.GlueTreeItem("Input Arguments", GlueTreeItem_1.TreeItemType.Arguments, element.Region, "", vscode.TreeItemCollapsibleState.Collapsed, undefined, element, run.Arguments));
                }
                // Status details
                children.push(new GlueTreeItem_1.GlueTreeItem(`Status: ${run.JobRunState}`, GlueTreeItem_1.TreeItemType.Detail, element.Region, "", vscode.TreeItemCollapsibleState.None, undefined, element));
                children.push(new GlueTreeItem_1.GlueTreeItem(`Started: ${run.StartedOn ? new Date(run.StartedOn).toLocaleString() : 'N/A'}`, GlueTreeItem_1.TreeItemType.Detail, element.Region, "", vscode.TreeItemCollapsibleState.None, undefined, element));
                children.push(new GlueTreeItem_1.GlueTreeItem(`ExecutionTime: ${run.ExecutionTime}s`, GlueTreeItem_1.TreeItemType.Detail, element.Region, "", vscode.TreeItemCollapsibleState.None, undefined, element));
                return children;
            }
            if (element.TreeItemType === GlueTreeItem_1.TreeItemType.Arguments) {
                if (!element.Payload)
                    return [];
                let args = element.Payload;
                return Object.keys(args).map(key => {
                    return new GlueTreeItem_1.GlueTreeItem(`${key}: ${args[key]}`, GlueTreeItem_1.TreeItemType.Detail, element.Region, "", vscode.TreeItemCollapsibleState.None, undefined, element);
                });
            }
            return [];
        }
        else {
            let items = [];
            if (!GlueService_1.GlueService.Instance)
                return items;
            let resourceList = GlueService_1.GlueService.Instance.ResourceList;
            for (let res of resourceList) {
                if (GlueService_1.GlueService.Instance.FilterString && !res.Name.includes(GlueService_1.GlueService.Instance.FilterString))
                    continue;
                let type = res.Type;
                // migration logic removed or adjusted
                items.push(new GlueTreeItem_1.GlueTreeItem(res.Name, type, res.Region, res.Name, vscode.TreeItemCollapsibleState.Collapsed));
            }
            return items;
        }
    }
    AddResource(region, name, type) {
        if (!GlueService_1.GlueService.Instance)
            return;
        if (!GlueService_1.GlueService.Instance.ResourceList.find(r => r.Region === region && r.Name === name && r.Type === type)) {
            GlueService_1.GlueService.Instance.ResourceList.push({ Region: region, Name: name, Type: type });
            this.Refresh();
        }
        return new GlueTreeItem_1.GlueTreeItem(name, type, region, name, vscode.TreeItemCollapsibleState.Collapsed);
    }
    RemoveResource(region, name, type) {
        if (!GlueService_1.GlueService.Instance)
            return;
        GlueService_1.GlueService.Instance.ResourceList = GlueService_1.GlueService.Instance.ResourceList.filter(r => !(r.Region === region && r.Name === name && r.Type === type));
        this.Refresh();
    }
}
exports.GlueTreeDataProvider = GlueTreeDataProvider;
//# sourceMappingURL=GlueTreeDataProvider.js.map