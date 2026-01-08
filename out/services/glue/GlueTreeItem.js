"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueTreeItem = exports.TreeItemType = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
var TreeItemType;
(function (TreeItemType) {
    TreeItemType["Job"] = "Job";
    TreeItemType["RunGroup"] = "RunGroup";
    TreeItemType["LogGroup"] = "LogGroup";
    TreeItemType["LogStream"] = "LogStream";
    TreeItemType["Run"] = "Run";
    TreeItemType["Detail"] = "Detail";
    TreeItemType["Arguments"] = "Arguments";
    TreeItemType["Info"] = "Info";
})(TreeItemType || (exports.TreeItemType = TreeItemType = {}));
class GlueTreeItem extends vscode.TreeItem {
    label;
    TreeItemType;
    Region;
    ResourceName;
    collapsibleState;
    command;
    Parent;
    Payload;
    constructor(label, TreeItemType, Region, ResourceName, collapsibleState, command, Parent, Payload) {
        super(label, collapsibleState);
        this.label = label;
        this.TreeItemType = TreeItemType;
        this.Region = Region;
        this.ResourceName = ResourceName;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.Parent = Parent;
        this.Payload = Payload;
        this.contextValue = TreeItemType;
        this.setIcons();
    }
    IsFav = false;
    IsHidden = false;
    IsRunning = false;
    RunId;
    setIcons() {
        let iconName = "";
        switch (this.TreeItemType) {
            case TreeItemType.Job:
                iconName = "settings-gear";
                break;
            case TreeItemType.RunGroup:
                iconName = "history";
                break;
            case TreeItemType.LogGroup:
                iconName = "output";
                break;
            case TreeItemType.LogStream:
                iconName = "list-unordered";
                break;
            case TreeItemType.Run:
                iconName = "play";
                break;
            case TreeItemType.Detail:
                iconName = "info";
                break;
            case TreeItemType.Arguments:
                iconName = "list-selection";
                break;
            case TreeItemType.Info:
                iconName = "info";
                break;
        }
        if (this.IsRunning) {
            this.iconPath = new vscode.ThemeIcon("sync~spin");
        }
        else {
            this.iconPath = new vscode.ThemeIcon(iconName);
        }
    }
    refreshUI() {
        this.setIcons();
    }
}
exports.GlueTreeItem = GlueTreeItem;
//# sourceMappingURL=GlueTreeItem.js.map