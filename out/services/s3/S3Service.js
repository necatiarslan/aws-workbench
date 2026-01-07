"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const vscode = require("vscode");
const S3TreeView_1 = require("./s3/S3TreeView");
const S3TreeItem_1 = require("./s3/S3TreeItem");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
class S3Service {
    serviceId = 's3';
    s3TreeView;
    constructor(context) {
        this.s3TreeView = new S3TreeView_1.S3TreeView(context);
    }
    registerCommands(context, treeProvider) {
        // Register all S3 commands here, delegating to this.s3TreeView
        // Note: For now we keep the same command IDs as in package.json
        context.subscriptions.push(vscode.commands.registerCommand('S3TreeView.Refresh', () => {
            this.s3TreeView.Refresh();
            treeProvider.refresh();
        }), vscode.commands.registerCommand('S3TreeView.AddBucket', async () => {
            await this.s3TreeView.AddBucket();
            treeProvider.refresh();
        }));
    }
    async getRootNodes() {
        const buckets = await this.s3TreeView.treeDataProvider.GetBucketNodes();
        return buckets.map(b => new WorkbenchTreeItem_1.WorkbenchTreeItem(typeof b.label === 'string' ? b.label : b.label?.label || '', vscode.TreeItemCollapsibleState.Collapsed, this.serviceId, b.contextValue, b));
    }
    async getChildren(element) {
        if (!element) {
            return this.getRootNodes();
        }
        // Map WorkbenchTreeItem to S3TreeItem if needed, or just use itemData
        let s3Item;
        if (element.itemData instanceof S3TreeItem_1.S3TreeItem) {
            s3Item = element.itemData;
        }
        else {
            // Reconstruct S3TreeItem from element.itemData
            s3Item = element.itemData;
        }
        if (!s3Item)
            return [];
        const children = await this.s3TreeView.treeDataProvider.getChildren(s3Item);
        return children.map(child => new WorkbenchTreeItem_1.WorkbenchTreeItem(typeof child.label === 'string' ? child.label : child.label?.label || '', child.collapsibleState || vscode.TreeItemCollapsibleState.None, this.serviceId, child.contextValue, child));
    }
    async getTreeItem(element) {
        const s3Item = element.itemData;
        return s3Item;
    }
    async addResource() {
        await this.s3TreeView.AddBucket();
    }
}
exports.S3Service = S3Service;
//# sourceMappingURL=S3Service.js.map