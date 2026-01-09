"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewType = exports.S3TreeDataProvider = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const S3TreeItem_1 = require("./S3TreeItem");
const TreeItemType_1 = require("../../tree/TreeItemType");
const S3Service_1 = require("./S3Service");
const Session_1 = require("../../common/Session");
class S3TreeDataProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    BucketNodeList = [];
    ShortcutNodeList = [];
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
    AddBucket(Bucket) {
        if (this.BucketList.includes(Bucket)) {
            return this.BucketNodeList.find(n => n.Bucket === Bucket);
        }
        this.BucketList.push(Bucket);
        this.LoadBucketNodeList();
        this.Refresh();
        return this.BucketNodeList.find(n => n.Bucket === Bucket);
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
    LoadBucketNodeList() {
        this.BucketNodeList = [];
        for (var bucket of this.BucketList) {
            let treeItem = new S3TreeItem_1.S3TreeItem(bucket, TreeItemType_1.TreeItemType.S3Bucket);
            treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            treeItem.Bucket = bucket;
            treeItem.ProfileToShow = this.GetBucketProfile(bucket);
            this.BucketNodeList.push(treeItem);
        }
    }
    LoadShortcutNodeList() {
        this.ShortcutNodeList = [];
        for (var lg of this.ShortcutList) {
            let treeItem = new S3TreeItem_1.S3TreeItem(lg["Shortcut"], TreeItemType_1.TreeItemType.S3Shortcut);
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
            result = this.GetBucketNodes();
        }
        else if (node.TreeItemType === TreeItemType_1.TreeItemType.S3Bucket) {
            result = this.GetShortcutNodesParentBucket(node);
        }
        return result;
    }
    GetBucketNodes() {
        var result = [];
        for (var node of this.BucketNodeList) {
            if (S3Service_1.S3Service.Instance && Session_1.Session.Current?.FilterString && !node.IsFilterStringMatch(Session_1.Session.Current?.FilterString)) {
                continue;
            }
            if (S3Service_1.S3Service.Instance && Session_1.Session.Current?.IsShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) {
                continue;
            }
            if (S3Service_1.S3Service.Instance && !Session_1.Session.Current?.IsShowHiddenNodes && (node.IsHidden)) {
                continue;
            }
            if (S3Service_1.S3Service.Instance && !Session_1.Session.Current?.IsShowHiddenNodes && (node.ProfileToShow && node.ProfileToShow !== Session_1.Session.Current?.AwsProfile)) {
                continue;
            }
            result.push(node);
        }
        return result;
    }
    GetShortcutNodesParentBucket(BucketNode) {
        var result = [];
        for (var node of this.ShortcutNodeList) {
            if (!(node.Bucket === BucketNode.Bucket)) {
                continue;
            }
            if (S3Service_1.S3Service.Instance && Session_1.Session.Current?.FilterString && !node.IsFilterStringMatch(Session_1.Session.Current?.FilterString)) {
                continue;
            }
            if (S3Service_1.S3Service.Instance && Session_1.Session.Current?.IsShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) {
                continue;
            }
            if (S3Service_1.S3Service.Instance && !Session_1.Session.Current?.IsShowHiddenNodes && (node.IsHidden)) {
                continue;
            }
            if (S3Service_1.S3Service.Instance && !Session_1.Session.Current?.IsShowHiddenNodes && (node.ProfileToShow && node.ProfileToShow !== Session_1.Session.Current?.AwsProfile)) {
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
            if (S3Service_1.S3Service.Instance && Session_1.Session.Current?.FilterString && !node.IsFilterStringMatch(Session_1.Session.Current?.FilterString)) {
                continue;
            }
            if (S3Service_1.S3Service.Instance && Session_1.Session.Current?.IsShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) {
                continue;
            }
            if (S3Service_1.S3Service.Instance && !Session_1.Session.Current?.IsShowHiddenNodes && (node.IsHidden)) {
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