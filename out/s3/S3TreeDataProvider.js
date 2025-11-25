"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewType = exports.S3TreeDataProvider = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const S3TreeItem_1 = require("./S3TreeItem");
const S3TreeView_1 = require("./S3TreeView");
const ui = require("../common/UI");
class S3TreeDataProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    BucketNodeList = [];
    ShortcutNodeList = [];
    FolderNodeList = [];
    BucketList = [];
    ShortcutList = [];
    ViewType = ViewType.Bucket_Shortcut;
    BucketProfileList = [];
    constructor() {
    }
    Refresh() {
        this._onDidChangeTreeData.fire();
    }
    GetBucketList() {
        return this.BucketList;
    }
    GetShortcutList() {
        return this.ShortcutList;
    }
    SetBucketList(BucketList) {
        this.BucketList = BucketList;
        this.LoadBucketNodeList();
    }
    SetShortcutList(ShortcutList) {
        this.ShortcutList = ShortcutList;
        this.LoadShortcutNodeList();
    }
    AddBucketProfile(Bucket, Profile) {
        if (!Bucket || !Profile) {
            return;
        }
        let profile = this.GetBucketProfile(Bucket);
        if (profile === Profile) {
            return;
        }
        if (profile && profile !== Profile) {
            this.RemoveBucketProfile(Bucket);
        }
        this.BucketProfileList.push({ Bucket: Bucket, Profile: Profile });
    }
    RemoveBucketProfile(Bucket) {
        for (let i = 0; i < this.BucketProfileList.length; i++) {
            if (this.BucketProfileList[i].Bucket === Bucket) {
                this.BucketProfileList.splice(i, 1);
                i--;
            }
        }
    }
    GetBucketProfile(Bucket) {
        for (let i = 0; i < this.BucketProfileList.length; i++) {
            if (this.BucketProfileList[i].Bucket === Bucket) {
                return this.BucketProfileList[i].Profile;
            }
        }
        return "";
    }
    AddBucket(Bucket, parentNode) {
        if (this.BucketList.includes(Bucket)) {
            return;
        }
        this.BucketList.push(Bucket);
        let treeItem = new S3TreeItem_1.S3TreeItem(Bucket, S3TreeItem_1.TreeItemType.Bucket);
        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        treeItem.Bucket = Bucket;
        treeItem.ProfileToShow = this.GetBucketProfile(Bucket);
        if (parentNode && parentNode.TreeItemType === S3TreeItem_1.TreeItemType.Folder) {
            if (!parentNode.Children) {
                parentNode.Children = [];
            }
            parentNode.Children.push(treeItem);
            treeItem.Parent = parentNode;
        }
        else {
            this.BucketNodeList.push(treeItem);
        }
        this.Refresh();
    }
    RemoveBucket(Bucket) {
        for (let i = 0; i < this.ShortcutList.length; i++) {
            if (this.ShortcutList[i]["Bucket"] === Bucket) {
                this.ShortcutList.splice(i, 1);
                i--;
            }
        }
        this.LoadShortcutNodeList();
        for (let i = 0; i < this.BucketList.length; i++) {
            if (this.BucketList[i] === Bucket) {
                this.BucketList.splice(i, 1);
                i--;
            }
        }
        this.LoadBucketNodeList();
        this.Refresh();
    }
    RemoveAllShortcuts(Bucket) {
        for (let i = 0; i < this.ShortcutList.length; i++) {
            if (this.ShortcutList[i]["Bucket"] === Bucket) {
                this.ShortcutList.splice(i, 1);
                i--;
            }
        }
        this.LoadShortcutNodeList();
        this.Refresh();
    }
    DoesShortcutExists(Bucket, Key) {
        if (!Bucket || !Key) {
            return false;
        }
        for (var ls of this.ShortcutList) {
            if (ls["Bucket"] === Bucket && ls["Shortcut"] === Key) {
                return true;
            }
        }
        return false;
    }
    AddShortcut(Bucket, Key) {
        if (!Bucket || !Key) {
            return;
        }
        if (this.DoesShortcutExists(Bucket, Key)) {
            return;
        }
        this.ShortcutList.push({ Bucket: Bucket, Shortcut: Key });
        this.LoadShortcutNodeList();
        this.Refresh();
    }
    RemoveShortcut(Bucket, Shortcut) {
        for (let i = 0; i < this.ShortcutList.length; i++) {
            if (this.ShortcutList[i]["Bucket"] === Bucket && this.ShortcutList[i]["Shortcut"] === Shortcut) {
                this.ShortcutList.splice(i, 1);
                i--;
            }
        }
        this.LoadShortcutNodeList();
        this.Refresh();
    }
    UpdateShortcut(Bucket, Shortcut, NewShortcut) {
        for (let i = 0; i < this.ShortcutList.length; i++) {
            if (this.ShortcutList[i]["Bucket"] === Bucket && this.ShortcutList[i]["Shortcut"] === Shortcut) {
                this.ShortcutList[i]["Shortcut"] = NewShortcut;
            }
        }
        this.LoadShortcutNodeList();
        this.Refresh();
    }
    AddFolder(folderName, folderPath, parentNode) {
        ui.logToOutput('S3TreeDataProvider.AddFolder Started');
        let folder = new S3TreeItem_1.S3TreeItem(folderName, S3TreeItem_1.TreeItemType.Folder);
        folder.FolderPath = folderPath;
        folder.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        if (parentNode && parentNode.TreeItemType === S3TreeItem_1.TreeItemType.Folder) {
            if (!parentNode.Children) {
                parentNode.Children = [];
            }
            parentNode.Children.push(folder);
            folder.Parent = parentNode;
        }
        else {
            this.FolderNodeList.push(folder);
        }
        this.Refresh();
    }
    RenameFolder(node, newName) {
        ui.logToOutput('S3TreeDataProvider.RenameFolder Started');
        node.Text = newName;
        node.label = newName;
        // Update folder path
        const oldPath = node.FolderPath || '';
        const parentPath = node.Parent?.FolderPath || '';
        const newPath = parentPath ? `${parentPath}/${newName}` : newName;
        // Update this folder and all children recursively
        this.updateFolderPathsRecursive(node, oldPath, newPath);
        this.Refresh();
    }
    RemoveFolder(node) {
        ui.logToOutput('S3TreeDataProvider.RemoveFolder Started');
        if (node.Parent) {
            const index = node.Parent.Children.indexOf(node);
            if (index > -1) {
                node.Parent.Children.splice(index, 1);
            }
        }
        else {
            const index = this.FolderNodeList.indexOf(node);
            if (index > -1) {
                this.FolderNodeList.splice(index, 1);
            }
        }
        this.Refresh();
    }
    updateFolderPathsRecursive(node, oldPath, newPath) {
        node.FolderPath = newPath;
        if (node.Children) {
            for (const child of node.Children) {
                if (child.FolderPath) {
                    child.FolderPath = child.FolderPath.replace(oldPath, newPath);
                }
                if (child.TreeItemType === S3TreeItem_1.TreeItemType.Folder) {
                    this.updateFolderPathsRecursive(child, oldPath, newPath);
                }
            }
        }
    }
    LoadBucketNodeList() {
        this.BucketNodeList = [];
        for (var bucket of this.BucketList) {
            let treeItem = new S3TreeItem_1.S3TreeItem(bucket, S3TreeItem_1.TreeItemType.Bucket);
            treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            treeItem.Bucket = bucket;
            treeItem.ProfileToShow = this.GetBucketProfile(bucket);
            this.BucketNodeList.push(treeItem);
        }
    }
    LoadShortcutNodeList() {
        this.ShortcutNodeList = [];
        for (var lg of this.ShortcutList) {
            let treeItem = new S3TreeItem_1.S3TreeItem(lg["Shortcut"], S3TreeItem_1.TreeItemType.Shortcut);
            treeItem.Bucket = lg["Bucket"];
            treeItem.Shortcut = lg["Shortcut"];
            this.ShortcutNodeList.push(treeItem);
        }
    }
    getChildren(node) {
        let result = [];
        if (this.ViewType === ViewType.Bucket_Shortcut) {
            result = this.GetNodesBucketShortcut(node);
        }
        return Promise.resolve(result);
    }
    GetNodesShortcut(node) {
        let result = [];
        result = this.GetShortcutNodes();
        return result;
    }
    GetNodesBucketShortcut(node) {
        let result = [];
        if (!node) {
            // Root level - show folders and buckets
            result = [...this.GetFolderNodes(), ...this.GetBucketNodes()];
        }
        else if (node.TreeItemType === S3TreeItem_1.TreeItemType.Folder) {
            // Folder - show children
            result = node.Children || [];
        }
        else if (node.TreeItemType === S3TreeItem_1.TreeItemType.Bucket) {
            result = this.GetShortcutNodesParentBucket(node);
        }
        return result;
    }
    GetBucketNodes() {
        var result = [];
        for (var node of this.BucketNodeList) {
            if (S3TreeView_1.S3TreeView.Current && S3TreeView_1.S3TreeView.Current.FilterString && !node.IsFilterStringMatch(S3TreeView_1.S3TreeView.Current.FilterString)) {
                continue;
            }
            if (S3TreeView_1.S3TreeView.Current && S3TreeView_1.S3TreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) {
                continue;
            }
            if (S3TreeView_1.S3TreeView.Current && !S3TreeView_1.S3TreeView.Current.isShowHiddenNodes && (node.IsHidden)) {
                continue;
            }
            if (S3TreeView_1.S3TreeView.Current && !S3TreeView_1.S3TreeView.Current.isShowHiddenNodes && (node.ProfileToShow && node.ProfileToShow !== S3TreeView_1.S3TreeView.Current.AwsProfile)) {
                continue;
            }
            result.push(node);
        }
        return result;
    }
    GetFolderNodes() {
        var result = [];
        for (var node of this.FolderNodeList) {
            if (S3TreeView_1.S3TreeView.Current && S3TreeView_1.S3TreeView.Current.FilterString && !node.IsFilterStringMatch(S3TreeView_1.S3TreeView.Current.FilterString)) {
                continue;
            }
            if (S3TreeView_1.S3TreeView.Current && S3TreeView_1.S3TreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) {
                continue;
            }
            if (S3TreeView_1.S3TreeView.Current && !S3TreeView_1.S3TreeView.Current.isShowHiddenNodes && (node.IsHidden)) {
                continue;
            }
            result.push(node);
        }
        return result;
    }
    GetTreeStructure() {
        const { TreeItemType } = require('./S3TreeItem');
        const buildTree = (nodes) => {
            const items = [];
            for (const node of nodes) {
                if (node.TreeItemType === TreeItemType.Folder) {
                    const children = node.Children ? buildTree(node.Children) : [];
                    items.push({
                        type: 'folder',
                        name: node.Text,
                        children: children
                    });
                }
                else if (node.TreeItemType === TreeItemType.Bucket) {
                    const shortcuts = [];
                    if (node.Children) {
                        for (const child of node.Children) {
                            if (child.TreeItemType === TreeItemType.Shortcut) {
                                shortcuts.push(child.Shortcut || '');
                            }
                        }
                    }
                    items.push({
                        type: 'bucket',
                        name: node.Bucket || '',
                        shortcuts: shortcuts
                    });
                }
            }
            return items;
        };
        // Combine root folders and root buckets
        const rootNodes = [...this.FolderNodeList, ...this.BucketNodeList];
        return buildTree(rootNodes);
    }
    LoadFromTreeStructure(tree) {
        const { TreeItemType } = require('./S3TreeItem');
        // Clear existing lists
        this.BucketList = [];
        this.ShortcutList = [];
        this.BucketNodeList = [];
        this.FolderNodeList = [];
        this.ShortcutNodeList = [];
        const processItem = (item, parentNode) => {
            if (item.type === 'folder') {
                // Create folder node
                const folder = new S3TreeItem_1.S3TreeItem(item.name, TreeItemType.Folder);
                folder.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
                // Set path
                const parentPath = parentNode?.FolderPath || '';
                folder.FolderPath = parentPath ? `${parentPath}/${item.name}` : item.name;
                // Add to parent or root list
                if (parentNode) {
                    if (!parentNode.Children) {
                        parentNode.Children = [];
                    }
                    parentNode.Children.push(folder);
                    folder.Parent = parentNode;
                }
                else {
                    this.FolderNodeList.push(folder);
                }
                // Process children
                if (item.children) {
                    for (const child of item.children) {
                        processItem(child, folder);
                    }
                }
            }
            else if (item.type === 'bucket') {
                // Add to bucket list if not exists
                if (!this.BucketList.includes(item.name)) {
                    this.BucketList.push(item.name);
                }
                // Create bucket node
                const bucketNode = new S3TreeItem_1.S3TreeItem(item.name, TreeItemType.Bucket);
                bucketNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
                bucketNode.Bucket = item.name;
                bucketNode.ProfileToShow = this.GetBucketProfile(item.name);
                // Add to parent or root list
                if (parentNode) {
                    if (!parentNode.Children) {
                        parentNode.Children = [];
                    }
                    parentNode.Children.push(bucketNode);
                    bucketNode.Parent = parentNode;
                }
                else {
                    this.BucketNodeList.push(bucketNode);
                }
                // Process shortcuts
                if (item.shortcuts) {
                    for (const shortcut of item.shortcuts) {
                        this.ShortcutList.push({ Bucket: item.name, Shortcut: shortcut });
                        const shortcutNode = new S3TreeItem_1.S3TreeItem(shortcut, TreeItemType.Shortcut);
                        shortcutNode.Bucket = item.name;
                        shortcutNode.Shortcut = shortcut;
                        shortcutNode.Parent = bucketNode;
                        if (!bucketNode.Children) {
                            bucketNode.Children = [];
                        }
                        bucketNode.Children.push(shortcutNode);
                        this.ShortcutNodeList.push(shortcutNode);
                    }
                }
            }
        };
        for (const item of tree) {
            processItem(item);
        }
        this.Refresh();
    }
    GetShortcutNodesParentBucket(BucketNode) {
        var result = [];
        for (var node of this.ShortcutNodeList) {
            if (!(node.Bucket === BucketNode.Bucket)) {
                continue;
            }
            if (S3TreeView_1.S3TreeView.Current && S3TreeView_1.S3TreeView.Current.FilterString && !node.IsFilterStringMatch(S3TreeView_1.S3TreeView.Current.FilterString)) {
                continue;
            }
            if (S3TreeView_1.S3TreeView.Current && S3TreeView_1.S3TreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) {
                continue;
            }
            if (S3TreeView_1.S3TreeView.Current && !S3TreeView_1.S3TreeView.Current.isShowHiddenNodes && (node.IsHidden)) {
                continue;
            }
            if (S3TreeView_1.S3TreeView.Current && !S3TreeView_1.S3TreeView.Current.isShowHiddenNodes && (node.ProfileToShow && node.ProfileToShow !== S3TreeView_1.S3TreeView.Current.AwsProfile)) {
                continue;
            }
            node.Parent = BucketNode;
            if (BucketNode.Children.indexOf(node) === -1) {
                BucketNode.Children.push(node);
            }
            result.push(node);
        }
        return result;
    }
    GetShortcutNodes() {
        var result = [];
        for (var node of this.ShortcutNodeList) {
            if (S3TreeView_1.S3TreeView.Current && S3TreeView_1.S3TreeView.Current.FilterString && !node.IsFilterStringMatch(S3TreeView_1.S3TreeView.Current.FilterString)) {
                continue;
            }
            if (S3TreeView_1.S3TreeView.Current && S3TreeView_1.S3TreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) {
                continue;
            }
            if (S3TreeView_1.S3TreeView.Current && !S3TreeView_1.S3TreeView.Current.isShowHiddenNodes && (node.IsHidden)) {
                continue;
            }
            result.push(node);
        }
        return result;
    }
    getTreeItem(element) {
        return element;
    }
}
exports.S3TreeDataProvider = S3TreeDataProvider;
var ViewType;
(function (ViewType) {
    ViewType[ViewType["Bucket_Shortcut"] = 1] = "Bucket_Shortcut";
})(ViewType || (exports.ViewType = ViewType = {}));
//# sourceMappingURL=S3TreeDataProvider.js.map