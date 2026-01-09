/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { GlueTreeItem } from './GlueTreeItem';
import { TreeItemType } from '../../tree/TreeItemType';
import { GlueService } from './GlueService';
import { Session } from '../../common/Session';

export class GlueTreeDataProvider implements vscode.TreeDataProvider<GlueTreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<GlueTreeItem | undefined | void> = new vscode.EventEmitter<GlueTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<GlueTreeItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor() { }

	Refresh(node?: GlueTreeItem): void {
		this._onDidChangeTreeData.fire(node);
	}

	getTreeItem(element: GlueTreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: GlueTreeItem): Promise<GlueTreeItem[]> {
		if (element) {
			if (element.TreeItemType === TreeItemType.GlueJob) {
				return [
					new GlueTreeItem("Info", TreeItemType.GlueInfo, element.Region, element.ResourceName, vscode.TreeItemCollapsibleState.Collapsed, undefined, element),
					new GlueTreeItem("Runs", TreeItemType.GlueRunGroup, element.Region, element.ResourceName, vscode.TreeItemCollapsibleState.Collapsed, undefined, element),
					new GlueTreeItem("/aws-glue/jobs/output", TreeItemType.GlueLogGroup, element.Region, element.ResourceName, vscode.TreeItemCollapsibleState.Collapsed, undefined, element),
					new GlueTreeItem("/aws-glue/jobs/error", TreeItemType.GlueLogGroup, element.Region, element.ResourceName, vscode.TreeItemCollapsibleState.Collapsed, undefined, element)
				];
			}
			if (element.TreeItemType === TreeItemType.GlueInfo) {
				let jobInfo = element.Payload || GlueService.Instance.JobInfoCache[element.ResourceName];
				if (!jobInfo) return [new GlueTreeItem("No Data (Refresh to Load)", TreeItemType.GlueDetail, element.Region, "", vscode.TreeItemCollapsibleState.None, undefined, element)];
				
				let nodes: GlueTreeItem[] = [];
				for (let key in jobInfo) {
					let val = jobInfo[key];
					if (typeof val === 'object' && val !== null) {
						nodes.push(new GlueTreeItem(`${key}: ...`, TreeItemType.GlueInfo, element.Region, element.ResourceName, vscode.TreeItemCollapsibleState.Collapsed, undefined, element, val));
					} else {
						nodes.push(new GlueTreeItem(`${key}: ${val}`, TreeItemType.GlueDetail, element.Region, "", vscode.TreeItemCollapsibleState.None, undefined, element));
					}
				}
				return nodes;
			}
			if (element.TreeItemType === TreeItemType.GlueRunGroup) {
				// Runs will be added dynamically by RefreshRuns
				let runs = element.Payload;
				if (element.Parent && GlueService.Instance.JobRunsCache[element.Parent.ResourceName]) {
					runs = GlueService.Instance.JobRunsCache[element.Parent.ResourceName];
				}

				if (!runs) return [];
				if (runs.length === 0) return [new GlueTreeItem("No Runs Found", TreeItemType.GlueDetail, element.Region, "", vscode.TreeItemCollapsibleState.None, undefined, element)];
				
				return (runs as any[]).map(run => {
					let runLabel = `${run.Id} (${run.JobRunState})`;
					return new GlueTreeItem(runLabel, TreeItemType.GlueRun, element.Region, run.Id, vscode.TreeItemCollapsibleState.Collapsed, undefined, element, run);
				});
			}
			if (element.TreeItemType === TreeItemType.GlueLogGroup) {
				// Log streams will be added dynamically by RefreshLogStreams
				let streams = GlueService.Instance.LogStreamsCache[element.label!];
				if (!streams) return [];
				if (streams.length === 0) return [new GlueTreeItem("No Logs Found", TreeItemType.GlueDetail, element.Region, "", vscode.TreeItemCollapsibleState.None, undefined, element)];
				
				return streams.map(s => new GlueTreeItem(s, TreeItemType.GlueLogStream, element.Region, s, vscode.TreeItemCollapsibleState.None, undefined, element));
			}
			if (element.TreeItemType === TreeItemType.GlueRun) {
				if (!element.Payload) return [];
				let run = element.Payload;
				let children: GlueTreeItem[] = [];

				// Log nodes
				let outLog = new GlueTreeItem("View Output Logs", TreeItemType.GlueLogStream, element.Region, run.Id, vscode.TreeItemCollapsibleState.None, undefined, element, { LogGroupName: "/aws-glue/jobs/output" });
				outLog.command = { command: 'aws-workbench.glue.ViewLog', title: 'View Log', arguments: [outLog] };
				children.push(outLog);

				let errLog = new GlueTreeItem("View Error Logs", TreeItemType.GlueLogStream, element.Region, run.Id, vscode.TreeItemCollapsibleState.None, undefined, element, { LogGroupName: "/aws-glue/jobs/error" });
				errLog.command = { command: 'aws-workbench.glue.ViewLog', title: 'View Log', arguments: [errLog] };
				children.push(errLog);

				// Arguments node
				if (run.Arguments) {
					children.push(new GlueTreeItem("Input Arguments", TreeItemType.GlueArguments, element.Region, "", vscode.TreeItemCollapsibleState.Collapsed, undefined, element, run.Arguments));
				}

				// Status details
				children.push(new GlueTreeItem(`Status: ${run.JobRunState}`, TreeItemType.GlueDetail, element.Region, "", vscode.TreeItemCollapsibleState.None, undefined, element));
				children.push(new GlueTreeItem(`Started: ${run.StartedOn ? new Date(run.StartedOn).toLocaleString() : 'N/A'}`, TreeItemType.GlueDetail, element.Region, "", vscode.TreeItemCollapsibleState.None, undefined, element));
				children.push(new GlueTreeItem(`ExecutionTime: ${run.ExecutionTime}s`, TreeItemType.GlueDetail, element.Region, "", vscode.TreeItemCollapsibleState.None, undefined, element));
				
				return children;
			}
			if (element.TreeItemType === TreeItemType.GlueArguments) {
				if (!element.Payload) return [];
				let args = element.Payload;
				return Object.keys(args).map(key => {
					return new GlueTreeItem(`${key}: ${args[key]}`, TreeItemType.GlueDetail, element.Region, "", vscode.TreeItemCollapsibleState.None, undefined, element);
				});
			}
			return [];
		} else {
			let items: GlueTreeItem[] = [];
			if(!GlueService.Instance) return items;
			let resourceList = GlueService.Instance.ResourceList;

			for (let res of resourceList) {
				if (Session.Current?.FilterString && !res.Name.includes(Session.Current?.FilterString)) continue;
				
				let type = res.Type as TreeItemType;
				// migration logic removed or adjusted
				items.push(new GlueTreeItem(res.Name, type, res.Region, res.Name, vscode.TreeItemCollapsibleState.Collapsed));
			}

			return items;
		}
	}

	AddResource(region: string, name: string, type: TreeItemType): GlueTreeItem | undefined {
		if(!GlueService.Instance) return;
		if (!GlueService.Instance.ResourceList.find(r => r.Region === region && r.Name === name && r.Type === type)) {
			GlueService.Instance.ResourceList.push({ Region: region, Name: name, Type: type as any });
			this.Refresh();
		}
		return new GlueTreeItem(name, type, region, name, vscode.TreeItemCollapsibleState.Collapsed);
	}

	RemoveResource(region: string, name: string, type: TreeItemType) {
		if(!GlueService.Instance) return;
		GlueService.Instance.ResourceList = GlueService.Instance.ResourceList.filter(r => !(r.Region === region && r.Name === name && r.Type === type));
		this.Refresh();
	}
}