"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepfunctionsService = void 0;
const vscode = require("vscode");
const AbstractAwsService_1 = require("../AbstractAwsService");
const StepFuncTreeDataProvider_1 = require("./StepFuncTreeDataProvider");
const TreeItemType_1 = require("../../tree/TreeItemType");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
const ui = require("../../common/UI");
const api = require("./API");
class StepfunctionsService extends AbstractAwsService_1.AbstractAwsService {
    static Instance;
    serviceId = 'stepfunctions';
    treeDataProvider;
    context;
    StepFuncList = [];
    PayloadPathList = [];
    CodePathList = [];
    constructor(context) {
        super();
        StepfunctionsService.Instance = this;
        this.context = context;
        this.loadBaseState();
        this.loadCustomResources();
        this.treeDataProvider = new StepFuncTreeDataProvider_1.StepFuncTreeDataProvider();
        this.Refresh();
    }
    registerCommands(context, treeProvider, treeView) {
        const wrap = (node) => {
            if (node instanceof WorkbenchTreeItem_1.WorkbenchTreeItem) {
                return node.itemData;
            }
            return node;
        };
        context.subscriptions.push(vscode.commands.registerCommand('aws-workbench.step-functions.Refresh', () => {
            this.Refresh();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.step-functions.AddStepFunc', async () => {
            await this.AddStepFunc();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('aws-workbench.step-functions.RemoveStepFunc', async (node) => {
            await this.RemoveStepFunc(wrap(node));
            treeProvider.refresh();
        }));
    }
    async getRootNodes() {
        const nodes = this.treeDataProvider.GetStepFuncNodes();
        const items = nodes.map(n => this.mapToWorkbenchItem(n));
        // Add ungrouped custom resources (not in any folder)
        const ungroupedCustomResources = this.getCustomResourcesByFolder(null);
        for (const resource of ungroupedCustomResources) {
            const customItem = new WorkbenchTreeItem_1.WorkbenchTreeItem(this.getDisplayName(resource), vscode.TreeItemCollapsibleState.Collapsed, this.serviceId, 'customResource', resource.resourceData);
            customItem.isCustom = true;
            customItem.compositeKey = resource.compositeKey;
            customItem.displayName = resource.displayName;
            customItem.awsName = resource.awsName;
            items.push(customItem);
        }
        return this.processNodes(items);
    }
    mapToWorkbenchItem(n) {
        const item = new WorkbenchTreeItem_1.WorkbenchTreeItem(typeof n.label === 'string' ? n.label : n.label?.label || '', n.collapsibleState || vscode.TreeItemCollapsibleState.None, this.serviceId, n.contextValue, n);
        if (!item.id) {
            if (n.StepFuncArn) {
                item.id = n.StepFuncArn;
            }
            else if (n.ExecutionArn) {
                item.id = n.ExecutionArn;
            }
            else if (n.Region && n.StepFuncName) {
                item.id = `${n.Region}:${n.StepFuncName}:${n.TreeItemType ?? ''}`;
            }
            else if (n.Region) {
                item.id = n.Region;
            }
        }
        if (n.iconPath) {
            item.iconPath = n.iconPath;
        }
        if (n.description) {
            item.description = n.description;
        }
        if (n.tooltip) {
            item.tooltip = n.tooltip;
        }
        if (n.command) {
            item.command = n.command;
        }
        if (n.resourceUri) {
            item.resourceUri = n.resourceUri;
        }
        return item;
    }
    async getChildren(element) {
        if (!element) {
            return this.getRootNodes();
        }
        const internalItem = element.itemData;
        if (!internalItem)
            return [];
        const children = await this.treeDataProvider.getChildren(internalItem);
        const items = (children || []).map((child) => this.mapToWorkbenchItem(child));
        return this.processNodes(items);
    }
    async getTreeItem(element) {
        return element;
    }
    async addResource() {
        return await this.AddStepFunc();
    }
    Refresh() {
        this.treeDataProvider.Refresh();
    }
    async AddStepFunc() {
        ui.logToOutput('StepfunctionsService.AddStepFunc Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) {
            return;
        }
        let selectedStepFuncName = await vscode.window.showInputBox({ placeHolder: 'Enter Step Function Name / Search Text' });
        if (selectedStepFuncName === undefined) {
            return;
        }
        var resultStepFunc = await api.GetStepFuncList(selectedRegion, selectedStepFuncName);
        if (!resultStepFunc.isSuccessful) {
            return;
        }
        let selectedStepFuncList = await vscode.window.showQuickPick(resultStepFunc.result, { canPickMany: true, placeHolder: 'Select Step Function(s)' });
        if (!selectedStepFuncList || selectedStepFuncList.length === 0) {
            return;
        }
        let lastAddedItem;
        for (var selectedStepFunc of selectedStepFuncList) {
            lastAddedItem = this.treeDataProvider.AddStepFunc(selectedRegion, selectedStepFunc);
        }
        return lastAddedItem ? this.mapToWorkbenchItem(lastAddedItem) : undefined;
    }
    async RemoveStepFunc(node) {
        if (!node || node.TreeItemType !== TreeItemType_1.TreeItemType.StepFunctionsStateMachine || !node.Region || !node.StepFuncArn) {
            return;
        }
        this.treeDataProvider.RemoveStepFunc(node.Region, node.StepFuncArn);
    }
    addToFav(node) {
        const data = node.itemData;
        if (data) {
            data.IsFav = true;
            data.setContextValue();
        }
        super.addToFav(node);
    }
    deleteFromFav(node) {
        const data = node.itemData;
        if (data) {
            data.IsFav = false;
            data.setContextValue();
        }
        super.deleteFromFav(node);
    }
    hideResource(node) {
        const data = node.itemData;
        if (data) {
            data.IsHidden = true;
            data.setContextValue();
        }
        super.hideResource(node);
    }
    unhideResource(node) {
        const data = node.itemData;
        if (data) {
            data.IsHidden = false;
            data.setContextValue();
        }
        super.unhideResource(node);
    }
    showOnlyInProfile(node, profile) {
        const data = node.itemData;
        if (data) {
            data.ProfileToShow = profile;
            data.setContextValue();
        }
        super.showOnlyInProfile(node, profile);
    }
    showInAnyProfile(node) {
        const data = node.itemData;
        if (data) {
            data.ProfileToShow = "";
            data.setContextValue();
        }
        super.showInAnyProfile(node);
    }
}
exports.StepfunctionsService = StepfunctionsService;
//# sourceMappingURL=StepfunctionsService.js.map