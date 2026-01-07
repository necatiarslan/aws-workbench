"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaService = void 0;
const vscode = require("vscode");
const LambdaTreeView_1 = require("./lambda/LambdaTreeView");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
class LambdaService {
    serviceId = 'lambda';
    lambdaTreeView;
    constructor(context) {
        this.lambdaTreeView = new LambdaTreeView_1.LambdaTreeView(context);
    }
    registerCommands(context, treeProvider) {
        context.subscriptions.push(vscode.commands.registerCommand('LambdaTreeView.Refresh', () => {
            this.lambdaTreeView.Refresh();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('LambdaTreeView.AddLambda', async () => {
            await this.lambdaTreeView.AddLambda();
            treeProvider.refresh();
        })
        // Add other commands as needed...
        );
    }
    async getRootNodes() {
        const lambdas = await this.lambdaTreeView.treeDataProvider.GetLambdaNodes();
        return lambdas.map(l => new WorkbenchTreeItem_1.WorkbenchTreeItem(typeof l.label === 'string' ? l.label : l.label?.label || '', vscode.TreeItemCollapsibleState.Collapsed, this.serviceId, l.contextValue, l));
    }
    async getChildren(element) {
        if (!element) {
            return this.getRootNodes();
        }
        const lambdaItem = element.itemData;
        if (!lambdaItem)
            return [];
        const children = await this.lambdaTreeView.treeDataProvider.getChildren(lambdaItem);
        return children.map(child => new WorkbenchTreeItem_1.WorkbenchTreeItem(typeof child.label === 'string' ? child.label : child.label?.label || '', child.collapsibleState || vscode.TreeItemCollapsibleState.None, this.serviceId, child.contextValue, child));
    }
    async getTreeItem(element) {
        return element.itemData;
    }
    async addResource() {
        await this.lambdaTreeView.AddLambda();
    }
}
exports.LambdaService = LambdaService;
//# sourceMappingURL=LambdaService.js.map